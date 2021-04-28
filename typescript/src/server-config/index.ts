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

export const createParameters = ({ parameters }: { parameters: IParams }) => ({
  _name: "parameters",
  _content: Object.keys(parameters).map((key) => ({
    _name: "parameter",
    _attrs: {
      name: key,
      value: parameters[key],
    },
  })),
});

export const createHazelCastHandler = (config) => ({
  _name: "handler",
  _attrs: {
    class: "com.orientechnologies.orient.server.hazelcast.OHazelcastPlugin",
  },
  _content: [createParameters(config)],
});

export const protocols = (config) => ({
  _name: "protocols",
  _content: [],
});

export const createListeners = (config) => ({});

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

export const createNetwork = (config) => ({
  _name: "network",
  _content: [createListeners(config.listeners)],
});

export const isAfterFirstTime = (isAfterFirstTime) => ({
  _name: "isAfterFirstTime",
  _content: !!isAfterFirstTime,
});

export const createOrientServerConfig = (config) => ({
  _name: "orient-server",
  _content: [createParameters(config)],
});
