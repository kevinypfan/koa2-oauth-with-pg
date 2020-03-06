// client_id;
// user_id;
// access_token;
// expires_in;
// refresh_token;

import * as moment from "moment";
import { getManager, Repository, Not, Equal } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { Token } from "../models/token";
import { generateRandomToken } from "./token-util";

export const genToken: Function = async (
  client_id: string,
  user_id: string
) => {
  const tokenRepository: Repository<Token> = getManager().getRepository(Token);

  const tokenToBeSaved = new Token();
  tokenToBeSaved.client_id = client_id;
  tokenToBeSaved.user_id = user_id;
  tokenToBeSaved.access_token = await generateRandomToken();
  tokenToBeSaved.expires_in = moment()
    .add(30, "days")
    .toDate();
  tokenToBeSaved.refresh_token = await generateRandomToken();

  const errors: ValidationError[] = await validate(tokenToBeSaved); // errors is an array of validation errors
  if (errors.length > 0) {
    // return BAD REQUEST status code and errors array
    throw Error("ValidationError");
  }
  const token = await tokenRepository.save(tokenToBeSaved);
  return token;
};
