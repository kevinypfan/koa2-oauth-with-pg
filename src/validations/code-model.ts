import { IsDefined, IsUrl } from "class-validator";

export class CodeModel {
  @IsDefined()
  code: string;

  @IsDefined()
  @IsUrl()
  redirect_uri: string;
}
