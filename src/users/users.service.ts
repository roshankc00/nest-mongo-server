import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { EncryptionService } from '../encryption/encryption.service';
import { CreateUserDto, UserResponseDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private encryptionService: EncryptionService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Encrypt sensitive fields
    const encryptedSsn = await this.encryptionService.encryptField(
      createUserDto.ssn,
      'deterministic', // Use deterministic encryption for queryable fields
    );

    const encryptedCreditCard = await this.encryptionService.encryptField(
      createUserDto.creditCardNumber,
      'random', // Use random encryption for highly sensitive fields
    );

    const createdUser = new this.userModel({
      name: createUserDto.name,
      ssn: encryptedSsn,
      creditCardNumber: encryptedCreditCard,
      email: createUserDto.email,
    });

    return createdUser.save();
  }

  async findBySsn(ssn: string): Promise<UserResponseDto | null> {
    const encryptedSsn = await this.encryptionService.encryptField(ssn, 'deterministic');
    const user = await this.userModel.findOne({ ssn: encryptedSsn }).exec();
    
    if (!user) return null;
    
    // Decrypt sensitive fields for return
    return {
      _id: user._id.toString(),
      name: user.name,
      ssn: await this.encryptionService.decryptField(user.ssn),
      creditCardNumber: await this.encryptionService.decryptField(user.creditCardNumber),
      email: user.email,
    };
  }

  async findOne(id: string): Promise<UserResponseDto | null> {
    const user = await this.userModel.findById(id).exec();
    if (!user) return null;

    // Decrypt sensitive fields for return
    return {
      _id: user._id.toString(),
      name: user.name,
      ssn: await this.encryptionService.decryptField(user.ssn),
      creditCardNumber: await this.encryptionService.decryptField(user.creditCardNumber),
      email: user.email,
    };
  }
}
