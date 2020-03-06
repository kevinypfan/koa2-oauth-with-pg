//access.line.me/oauth2/v2.1/noauto-login?__csrf=XgvdqQ2QgQez9Rmgl16oMz&idProvider=2&errorMessage=ACCOUNT_LOGIN_FAIL&errorCode=445&state=&lang=zh_TW&loginChannelId=1605736550&returnUri=%2Foauth2%2Fv2.1%2Fauthorize%2Fconsent%3Fscope%3Dopenid%2Bprofile%26response_type%3Dcode%26state%3Dinit%26redirect_uri%3Dhttps%253A%252F%252Fwww.learningcity.mlc.edu.tw%252Fapi%252Fauth%26client_id%3D1605736550#/
import { IsDefined, IsEmail } from "class-validator";
// response_type=code&client_id=qwertyuio123456789&redirect_uri=http://google.com&state=init&scope=profile

export class AuthenticateModel {
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
  password: string;
}
