import { IsDefined } from "class-validator";

export class ProfileModel {
  @IsDefined()
  Authorization: string;
}
