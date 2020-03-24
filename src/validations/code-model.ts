import { IsDefined, IsUrl } from "class-validator";

export class CodeModel {
  @IsDefined()
  code: string;

  @IsDefined()
  redirect_uri: string;
}
