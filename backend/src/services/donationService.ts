import { Donation, DonationStatus } from '../models/Donation.js';
import { BloodRequest } from '../models/BloodRequest.js';
import { AppError } from '../utils/appError.js';

export interface CreateDonationDTO {
  donorId: string;
  requestId: string;
}

export class DonationService {
  /** Create donation / Accept blood request */
  public static async createDonation(data: CreateDonationDTO) {
    const request = await BloodRequest.findById(data.requestId);
    if (!request) {
      throw new AppError('Blood request not found', 404);
    }

    if (request.status === 'fulfilled' || request.status === 'cancelled') {
      throw new AppError(`Cannot donate to a ${request.status} request`, 400);
    }

    // Check if donor has already accepted this request
    const existingDonation = await Donation.findOne({
      donorId: data.donorId,
      requestId: data.requestId,
      status: { $in: ['accepted', 'on_the_way', 'completed'] },
    });

    if (existingDonation) {
      throw new AppError('You have already accepted/donated for this request', 400);
    }

    const donation = await Donation.create({
      donorId: data.donorId,
      requestId: data.requestId,
      status: 'accepted',
    });

    // Update request status to active
    request.status = 'active';
    await request.save();

    return await donation.populate([
      { path: 'donorId', select: 'name bloodGroup phone' },
      { path: 'requestId', select: 'patientName hospitalName bloodGroup unitsRequired' },
    ]);
  }

  /** Mark donation as completed */
  public static async completeDonation(donationId: string, userId: string) {
    const donation = await Donation.findById(donationId);

    if (!donation) {
      throw new AppError('Donation record not found', 404);
    }

    // Ensure only donor or requester can complete
    if (donation.donorId.toString() !== userId) {
      const request = await BloodRequest.findById(donation.requestId);
      if (!request || request.requesterId.toString() !== userId) {
        throw new AppError('Unauthorized to update this donation status', 403);
      }
    }

    donation.status = 'completed';
    donation.completedAt = new Date();
    await donation.save();

    // Mark blood request as fulfilled
    await BloodRequest.findByIdAndUpdate(donation.requestId, {
      status: 'fulfilled',
    });

    return donation;
  }

  /** Get donor donation history */
  public static async getDonationHistory(donorId: string) {
    return await Donation.find({ donorId })
      .populate({
        path: 'requestId',
        select: 'patientName hospitalName bloodGroup unitsRequired urgency status createdAt',
      })
      .sort({ createdAt: -1 });
  }
}
