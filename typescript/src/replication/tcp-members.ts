import { toXML } from "jstoxml";

export const createTcpIpElement = (members: string[], enabled = true) => {
  const $members = members.map((member) => ({
    member: {
      _content: member,
    },
  }));
  const tcpIp = {
    _attrs: {
      enabled,
    },
    _content: $members,
  };

  return { "tcp-ip": tcpIp };
};

export const createTcpIpXml = (members: string[], enabled = true) => {
  const elem = createTcpIpElement(members, enabled);
  return toXML(elem);
};
