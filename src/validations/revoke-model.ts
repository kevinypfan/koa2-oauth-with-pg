import { IsDefined, IsUrl } from "class-validator";

export class RevokeModel {
  @IsDefined()
  client_id: string;

  @IsDefined()
  client_secret: string;
  
  @IsDefined()
  access_token: string;
}
