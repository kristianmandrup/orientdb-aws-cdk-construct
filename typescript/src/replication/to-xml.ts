import { toXML } from "jstoxml";
import { createTcpIp, createHazelcast } from "./hazelcast";

export const createTcpIpXml = (tcpIpConfig) => {
  const elem = createTcpIp(tcpIpConfig);
  return toXML(elem);
};

export const hazelcastToXml = (config) => {
  const elem = createHazelcast(config);
  return toXML(elem);
};
