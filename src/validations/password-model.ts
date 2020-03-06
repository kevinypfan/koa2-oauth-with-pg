import { IsDefined, IsEmail } from "class-validator";

export class PasswordModel {
  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  password: string;
}
