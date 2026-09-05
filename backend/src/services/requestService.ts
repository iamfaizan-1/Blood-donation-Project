import mongoose from 'mongoose';
import { BloodRequest, UrgencyLevel, RequestStatus, IHospitalLocation } from '../models/BloodRequest.js';
import { BloodGroup } from '../models/User.js';
import { AppError } from '../utils/appError.js';

import { DonorWorkflowService } from './donorWorkflowService.js';

export interface CreateBloodRequestDTO {
  requesterId: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospitalName: string;
  hospitalLocation?: IHospitalLocation;
  urgency?: UrgencyLevel;
  requiredDateTime?: Date;
  contactNumber: string;
  notes?: string;
  searchRadiusKm?: number;
}

export class RequestService {
  /** Create a new blood request */
  public static async createRequest(data: CreateBloodRequestDTO) {
    // Check for duplicate active request by same requester for same patient & hospital
    const existingActive = await BloodRequest.findOne({
      requesterId: data.requesterId,
      patientName: data.patientName.trim(),
      bloodGroup: data.bloodGroup,
      hospitalName: data.hospitalName.trim(),
      status: {
        $in: [
          'pending',
          'matching',
          'donor_found',
          'donor_accepted',
          'contact_established',
          'on_the_way',
        ],
      },
    });

    if (existingActive) {
      throw new AppError(
        'An active blood request for this patient and hospital already exists. Please check your active requests.',
        409
      );
    }

    const request = await BloodRequest.create({
      requesterId: data.requesterId,
      patientName: data.patientName.trim(),
      bloodGroup: data.bloodGroup,
      unitsRequired: data.unitsRequired,
      hospitalName: data.hospitalName.trim(),
      hospitalLocation: data.hospitalLocation || { address: '', latitude: 0, longitude: 0 },
      urgency: data.urgency || 'normal',
      requiredDateTime: data.requiredDateTime,
      contactNumber: data.contactNumber,
      notes: data.notes,
      searchRadiusKm: data.searchRadiusKm || 10,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(),
          updatedBy: data.requesterId,
        },
      ],
    });

    // Step 1 & 2: Automatically find compatible available donors and dispatch notifications
    try {
      await DonorWorkflowService.notifyMatchedDonors(request._id.toString());
    } catch (err: any) {
      console.warn('Auto donor notification warning:', err.message);
    }

    return request;
  }

  /** Get requests created by a specific user */
  public static async getUserRequests(userId: string) {
    return await BloodRequest.find({ requesterId: userId })
      .sort({ createdAt: -1 });
  }

  /** Get all active requests (for donors searching) */
  public static async getActiveRequests(filter?: { bloodGroup?: BloodGroup; status?: RequestStatus }) {
    const query: any = {};
    if (filter?.bloodGroup) query.bloodGroup = filter.bloodGroup;
    if (filter?.status) {
      query.status = filter.status;
    } else {
      query.status = {
        $in: [
          'pending',
          'active',
          'matching',
          'donor_found',
          'donor_accepted',
          'contact_established',
          'on_the_way',
        ],
      };
    }

    return await BloodRequest.find(query)
      .populate('requesterId', 'name phone isVerified')
      .sort({ createdAt: -1 });
  }

  /** Get request details by ID */
  public static async getRequestById(requestId: string) {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new AppError('Invalid request ID format', 400);
    }

    const request = await BloodRequest.findById(requestId).populate(
      'requesterId',
      'name phone isVerified'
    );

    if (!request) {
      throw new AppError('Blood request not found', 404);
    }

    return request;
  }

  /** Update request status */
  public static async updateRequestStatus(
    requestId: string,
    userId: string,
    status: RequestStatus
  ) {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new AppError('Invalid request ID format', 400);
    }

    const request = await BloodRequest.findById(requestId);

    if (!request) {
      throw new AppError('Blood request not found', 404);
    }

    // Only requester or admin can update status
    if (request.requesterId.toString() !== userId) {
      throw new AppError('Unauthorized to update this request status', 403);
    }

    request.status = status;
    await request.save();

    return request;
  }
}
