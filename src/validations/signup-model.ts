import { IsDefined, IsEmail } from "class-validator";

export class PostSignupModel {
  @IsDefined()
  response_type: string;

  @IsDefined()
  client_id: string;

  @IsDefined()
  redirect_uri: string;

  @IsDefined()
  state: string;

  @IsDefined()
  scope: string;

  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  username: string;

  @IsDefined()
  password: string;

  @IsDefined()
  confirm: string;
}
