/*
This file simply imports our models and creates an array with a list of
the tables we want to include when we connect to Postgres. Its overkill to
keep this info in a seperate file when we only have one table but it will be
really neat and clean once our app grows to have tens and hundreds of tables
*/
import { User } from "../models/user";
import { Token } from "../models/token";
import { Client } from "../models/client";
import { Code } from "../models/code";
import { Consent } from "../models/consent";
export const postgresTables = [User, Token, Client, Code, Consent];
