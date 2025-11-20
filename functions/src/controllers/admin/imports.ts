import * as functions from 'firebase-functions';
import * as express from 'express';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

import UserService from '../../services/UserService';
import AbstractService from '../../services/AbstractService';
import { api } from '../../services/utils';
import * as CONSTANTS from '../../constants';

export {
  functions,
  express,
  admin,
  cors,
  CONSTANTS,
  UserService,
  AbstractService,
  api,
};

export default UserService;