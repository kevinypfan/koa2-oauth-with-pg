import { IsDefined, IsUrl } from "class-validator";

export class RefreshModel {
  @IsDefined()
  refresh_token: string;
}
