import { IsDefined, IsUrl } from "class-validator";

export class TokenModel {
  @IsDefined()
  grant_type: string;

  @IsDefined()
  client_id: string;

  @IsDefined()
  client_secret: string;
}
