export interface CreateUserDto {
  name: string;
  ssn: string;
  creditCardNumber: string;
  email: string;
}

export interface UserResponseDto {
  _id: string;
  name: string;
  ssn: string;
  creditCardNumber: string;
  email: string;
}
