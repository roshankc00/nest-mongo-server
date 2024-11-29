import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Binary } from 'mongodb';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Binary, required: true })
  ssn: Binary;

  @Prop({ type: Binary, required: true })
  creditCardNumber: Binary;

  @Prop({ required: true })
  email: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
