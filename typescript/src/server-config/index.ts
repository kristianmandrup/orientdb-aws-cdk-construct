// <handler class="com.orientechnologies.orient.server.hazelcast.OHazelcastPlugin">
//   <parameters>
//     <parameter value="${distributed}" name="enabled" />
//     <parameter
//       value="${ORIENTDB_HOME}/config/default-distributed-db-config.json"
//       name="configuration.db.default"
//     />
//     <parameter
//       value="${ORIENTDB_HOME}/config/hazelcast.xml"
//       name="configuration.hazelcast"
//     />
//     <parameter value="development" name="nodeName" />
//   </parameters>
// </handler>;

interface IParams {
  [key: string]: string;
}

// implementation="com.orientechnologies.orient.server.network.protocol.http.command.get.OServerCommandGetStaticContent" pattern="GET|www GET|studio/ GET| GET|*.htm GET|*.html GET|*.xml GET|*.jpeg GET|*.jpg GET|*.png GET|*.gif GET|*.js GET|*.css GET|*.swf GET|*.ico GET|*.txt GET|*.otf GET|*.pjs GET|*.svg GET|*.json GET|*.woff GET|*.ttf GET|*.svgz" stateful="false"

interface IParam {
  key: string;
  value: string;
}

interface IEntry {
  name: string;
  value: string;
}

interface ICommand {
  implementation: string;
  pattern: string;
  stateful: boolean;
  parameters: IParams;
}

const commandImplMap = {
  static:
    "com.orientechnologies.orient.server.network.protocol.http.command.get.OServerCommandGetStaticContent",
};

const patternMap = {
  staticDefault:
    "GET|www GET|studio/ GET| GET|*.htm GET|*.html GET|*.xml GET|*.jpeg GET|*.jpg GET|*.png GET|*.gif GET|*.js GET|*.css GET|*.swf GET|*.ico GET|*.txt GET|*.otf GET|*.pjs GET|*.svg GET|*.json GET|*.woff GET|*.ttf GET|*.svgz",
};

export const createCommand = (command: ICommand) => {
  const implementation =
    commandImplMap[command.implementation] || command.implementation;
  const pattern = patternMap[command.pattern] || command.pattern;

  return {
    _name: "command",
    _attrs: {
      ...command,
      implementation,
      pattern,
    },
    _content: createCommandParameters(command),
  };
};

export const createCommands = ({ commands }: { commands: ICommand[] }) => ({
  _name: "parameters",
  _content: commands.map(createCommand),
});

export const createParameter = ({ key, value }: IParam) => ({
  _name: "parameter",
  _attrs: {
    name: key,
    value,
  },
});

export const createEntry = ({ name, value }: IEntry) => ({
  _name: "entry",
  _attrs: {
    name,
    value,
  },
});

export const createCommandParameters = ({
  parameters,
}: {
  parameters: IParams;
}) => ({
  _name: "parameters",
  _content: Object.keys(parameters).map((name) => {
    return createEntry({ name, value: parameters[name] });
  }),
});

export const createParameters = ({ parameters }: { parameters: IParams }) => ({
  _name: "parameters",
  _content: Object.keys(parameters).map((key) => {
    return createParameter({ key, value: parameters[key] });
  }),
});

const pluginHandlerMap = {
  hazelcast: "com.orientechnologies.orient.server.hazelcast.OHazelcastPlugin",
};

export const createHazelCastHandler = (config) => ({
  _name: "handler",
  _attrs: {
    class: "com.orientechnologies.orient.server.hazelcast.OHazelcastPlugin",
  },
  _content: [createParameters(config)],
});

const protocolImplMap = {
  binary:
    "com.orientechnologies.orient.server.network.protocol.binary.ONetworkProtocolBinary",
  http:
    "com.orientechnologies.orient.server.network.protocol.http.ONetworkProtocolHttpDb",
};

interface IProtocol {
  implementation: string;
  name: string;
}

export const createProtocol = (protocol) => {
  const implementation =
    protocolImplMap[protocol.implementation] || protocol.implementation;
  const name = patternMap[protocol.name] || protocol.name;

  return {
    _name: "protocol",
    _attrs: {
      implementation,
      name,
    },
  };
};

export const createProtocols = (config) => ({
  _name: "protocols",
  _content: config.protocols.map(createProtocol),
});

export interface IListener {
  protocol: string;
  socket: string;
  portRange: string;
  ipAddress: string;
  commands: ICommand[];
}

export const createListener = (listener: IListener) => ({
  _name: "listener",
  _attrs: {
    protocol: listener.protocol,
    socket: listener.socket,
    "port-range": listener.portRange,
    "ip-address": listener.ipAddress,
  },
  _content: listener.commands && createCommands(listener),
});

export const createListeners = (listeners: IListener[]) => ({
  _name: "listeners",
  _content: listeners.map(createListener),
});

export interface IUser {
  resources: string;
  name: string;
  password: string;
}

export const createUser = ({ resources, name, password }: IUser) => ({
  _name: "user",
  _attrs: {
    resources,
    name,
    password,
  },
});

export const createResource = () => {};

export const createUsers = (users: IUser[]) => ({
  _name: "users",
  _content: users.map(createUser),
});

export const createResources = (resources: any[]) => ({
  _name: "resources",
  _content: resources && resources.map(createResource),
});

export const createSecurity = ({ users, resources }: any) => ({
  _name: "security",
  _content: [createUsers(users), createResources(resources)],
});

interface INetwork {
  protocols?: IProtocol[];
  listeners?: IListener[];
}

export const createNetwork = ({ protocols, listeners }: INetwork) => ({
  _name: "network",
  _content: [
    protocols && createProtocols(protocols),
    listeners && createListeners(listeners),
  ],
});

export const isAfterFirstTime = (isAfterFirstTime) => ({
  _name: "isAfterFirstTime",
  _content: !!isAfterFirstTime,
});

export const createOrientServerConfig = (config) => ({
  _name: "orient-server",
  _content: [createParameters(config)],
});
