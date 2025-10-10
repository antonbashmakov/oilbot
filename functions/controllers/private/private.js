import dotenv from 'dotenv';

import {
  functions,
  cors,
  admin,
  express,
  UserService,
  MessageService,
  GmailPushService,
  DeepSeekFetcher,
  TableService,
  NoteService,
  HistoryService,
  GroupService,
  api,
  authorize,
  CONSTANTS,
  uuid,
  lodash
} from './imports.js';

const logger = functions.logger;

admin.initializeApp(functions.config().firebase, 'private');
dotenv.config();

const privateApi = express();

privateApi.use(cors(
  { origin: true } // allows all cross origin xhr requests
));

privateApi.use(async (req, res, next) => {
  const userService = new UserService(admin);
  try {
    return await authorize(req, res, next, userService, admin);
  } catch (err) {
    logger.error(err);
    return api.error(res);
  }

});

privateApi.get('/users/me', async (req, res) => {

  const user = req.user;

  api.send(res, user);
});

privateApi.get('/users/me/messages', async (req, res) => {

  const user = req.user;
  try {
    const messageService = new MessageService(admin);
    const messages = await messageService.fetchMessagesForUser(user);

    api.send(res, messages || []);

  } catch (err) {
    logger.error(err);
    return api.error(res);
  }

});
privateApi.get('/users/me/tables', async (req, res) => {


  const user = req.user;

  try {
    const tableService = new TableService(admin);
    const tables = await tableService.findAllForUser(user);

    api.send(res, tables);

  } catch (err) {
    logger.error(err);
    return api.error(res);
  }

});
privateApi.get('/users/me/groups', async (req, res) => {
  const user = req.user;

  try {
    const groupService = new GroupService(admin);
    const groups = await groupService.fetchForOwner(user);

    api.send(res, groups);

  } catch (err) {
    logger.error(err);
    return api.error(res);
  }

});

privateApi.get('/users/me/pages/landing', async (req, res) => {

  const user = req.user;

  try {
    const tableService = new TableService(admin);
    const messageService = new MessageService(admin);
    const groupService = new GroupService(admin);
    const groups = await groupService.fetchForOwner(user);
    const messages = await messageService.fetchMessagesForUser(user);
    const tables = await tableService.findAllForUser(user);

    api.send(res, { tables, messages, groups });

  } catch (err) {
    logger.error(err);
    return api.error(res);
  }
});
privateApi.get('/users/me/messages', async (req, res) => {

  const user = req.user;

  try {
    const messageService = new MessageService(admin);
    const messages = await messageService.fetchMessagesForUser(user);

    api.send(res, { messages });

  } catch (err) {
    logger.error(err);
    return api.error(res);
  }
});

privateApi.get('/users/me/messages/:messageId/attachments/:attachmentId', async (req, res) => {
  const { messageId, attachmentId } = req.params;

  const user = req.user;

  let { token } = user;

  const gmailPushService = new GmailPushService(token);

  const attachment = await gmailPushService.authorize().fetchAttachment(messageId, attachmentId);

  api.send(res, { attachment: attachment.data });
});

privateApi.put('/users/me/messages/:messageId', async (req, res) => {
  const { messageId } = req.params;

  const { fields } = req.body;

  if (!fields) {
    return api.badRequest(res, 'No fields to update');
  }
  const user = req.user;

  try {
    const messageService = new MessageService(admin);
    await messageService.update({ id: messageId }, fields);
    api.send(res);

  } catch (err) {
    return api.error(res);
  }
});

privateApi.put('/users/me/messages/:messageId/note', async (req, res) => {
  const { messageId } = req.params;

  const { note } = req.body;

  if (!note) {
    return api.badRequest(res, 'No note to save');
  }

  const user = req.user;

  try {
    const historyService = new HistoryService(admin);
    const visitedMessages = await historyService.findMessageHistoryForUser(user, messageId);

    if (!visitedMessages) {
      return api.badRequest(res, 'User does not own the message');
    }
    const noteToSave = { owner: { id: user.id }, text: note, message: { id: messageId } };
    const noteService = new NoteService(admin);

    noteService.add(noteToSave);
    api.send(res);

  } catch (err) {
    logger.error(err);
    return api.error(res, err);

  }
});

privateApi.post('/users/me/messages/:messageId/analyze', async (req, res) => {
  const { messageId } = req.params;
  const user = req.user;

  try {
    // Check if user has access to the message
    const historyService = new HistoryService(admin);
    const visitedMessages = await historyService.findMessageHistoryForUser(user, messageId);

    if (!visitedMessages) {
      return api.badRequest(res, 'User does not own the message');
    }

    // Get message details
    const messageService = new MessageService(admin);
    const message = await messageService.find(messageId);
    
    if (!message) {
      return api.notFound(res, 'Message not found');
    }

    // Create DeepSeekService and DeepSeekFetcher
    const deepseekFetcher = new DeepSeekFetcher(user);
    
    // Analyze message and get tags
    const tags = await deepseekFetcher.tags(message);
    
    // Update message with tags if tags were found
    if (tags && tags.length > 0) {
      await messageService.update({ id: messageId }, { tags });
    }
    
    // Return the analysis results
    api.send(res, { tags });
    
  } catch (err) {
    logger.error('Error analyzing message:', err);
    return api.error(res, err);
  }
});

privateApi.get('/users/me/messages/:messageId', async (req, res) => {
  const { messageId } = req.params;

  const user = req.user;

  const historyService = new HistoryService(admin);
  const visitedMessages = await historyService.findMessageHistoryForUser(user, messageId);

  if (!visitedMessages) {
    return api.badRequest(res, 'User does not own the message');
  }

  try {
    const messageService = new MessageService(admin);
    const message = await messageService.find(messageId);
    if (!message) {
      return api.notFound(res, 'Message not found');
    }

    const noteService = new NoteService(admin);
    const notes = await noteService.findAllForMessage(messageId);

    message.notes = notes;
    api.send(res, { message });

  } catch (err) {
    logger.error(err);
    api.error(res, err);

  }
});
privateApi.get('/users/me/messages/:messageId/notes', async (req, res) => {
  const { messageId } = req.params;

  const user = req.user;

  const historyService = new HistoryService(admin);
  
  const visitedMessages = await historyService.findMessageHistoryForUser(user, messageId);
  console.log(visitedMessages);

  if (!visitedMessages) {
    return api.badRequest(res, 'User does not own the message');
  }

  try {
    const noteService = new NoteService(admin);
    const notes = await noteService.findAllForMessage(messageId);

    api.send(res, { notes });

  } catch (err) {
    logger.error(err);
    api.error(res, err);

  }
});

privateApi.post('/users/me/subscribe', async (req, res) => {

  const { code } = req.body;
  const userService = new UserService(admin);
  const user = req.user;

  let { token } = user;

  if (!token && !code) {
    const gmailPushService = new GmailPushService();
    const url = gmailPushService.authorize().getAuthUrl();
    api.redirect(res, { url });
    return;
  }

  let gmailPushService = new GmailPushService();
  if (code) {
    try {
      token = await gmailPushService.authorize().getTokenByCode(code);
    } catch (err) {
      console.error(err);
      if (err.code === '400') return api.badRequest(res, 'Provided code is not valid');
      return api.error(res, err);
    }

    user.token = token;
    token.createdAt = new Date();
    userService.update(user, { token });
  }

  gmailPushService = new GmailPushService(token);

  const label = await gmailPushService.authorize().findLabelByName(CONSTANTS.DEFAULT_LABEL);

  if (!label) {
    api.notFound(res, 'no label found');
    return;
  }

  console.log('subscribe a user');
  await gmailPushService.subscribe(label);
  console.log('subscribe a user: done');

  label.createdAt = new Date();
  user.label = label;
  userService.update(user, { label });

  api.send(res, { label });
});
privateApi.post('/users/me/unsubscribe', async (req, res) => {
  const userService = new UserService(admin);
  const user = req.user;

  let { token } = user;

  console.log(token);

  let gmailPushService = new GmailPushService();
  gmailPushService = new GmailPushService(token);
  await gmailPushService.authorize();

  console.log('unsubscribe');
  
  await gmailPushService.unsubscribe();
  console.log('unsubscribe done');
  delete user.label;
  delete user.token;
  userService.update(user, {...user});

  api.send(res);
});
privateApi.post('/users/me/tables', async (req, res) => {

  const { table } = req.body;

  if (!table) {
    return api.badRequest(res, 'Table missing');
  }

  const user = req.user;

  const tableService = new TableService(admin);
  try {
    table.connections = {};
    table.properties = {};
    table.columnProperties = {};

    tableService.addForOwner(user, table);

  } catch (err) {
    console.log(err);
    api.error(res, err);
  }

  api.send(res);
});

privateApi.post('/users/me/groups', async (req, res) => {

  const { group } = req.body;

  if (!group) {
    return api.badRequest(res, 'Group missing');
  }

  const user = req.user;

  const groupService = new GroupService(admin);
  try {

    const ret = await groupService.addForOwner(user, group);
    api.send(res, ret);
  } catch (err) {
    logger.error(err);
    api.error(res, err);
  }

});

privateApi.post('/users/me/tables/:tableId/share', async (req, res) => {

  const { tableId } = req.params;

  const tableService = new TableService(admin);

  const table = await tableService.find(tableId);

  if (!table) {
    return api.notFound(res, `Table not found : ${tableId}`);
  }

  try {
    const token = uuid();
    await tableService.update(table, { share: { token } });
    api.send(res, { token });
  } catch (err) {
    return api.error(res, err);
  }

});

privateApi.put('/users/me/tables/:tableId', async (req, res) => {
  const { tableId } = req.params;

  const { fields } = req.body;

  if (!fields) {
    return api.badRequest(res, 'No fields to update');
  }


  const tabeService = new TableService(admin);
  const table = await tabeService.find(tableId);

  if (!table) {
    return api.notFound(res, `Table not found : ${tableId}`);
  }
  try {
    await tabeService.update(table, fields);
    api.send(res);

  } catch (err) {
    api.error(res, err);
  }
});
privateApi.put('/users/me/groups/:groupId', async (req, res) => {
  const { groupId } = req.params;

  const { fields } = req.body;

  if (!fields) {
    return api.badRequest(res, 'No fields to update');
  }


  const groupService = new GroupService(admin);
  const group = await groupService.find(groupId);

  if (!group) {
    return api.notFound(res, `Group not found : ${groupId}`);
  }
  try {

    if ( fields.messages) {
      fields.messages = lodash.orderBy(fields.messages, ['timestamp'], ['desc']);
    }

    await groupService.update(group, fields);
    api.send(res);

  } catch (err) {
    api.error(res, err);
  }
});




export default privateApi;
