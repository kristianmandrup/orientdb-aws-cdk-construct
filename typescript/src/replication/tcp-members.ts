import { toXML } from "jstoxml";

export const createTcpIp = (members: string[], enabled = true) => {
  const $members = members.map((member) => ({
    _name: "member",
    _content: member,
  }));
  return {
    _name: "tcp-ip",
    _attrs: {
      enabled,
    },
    _content: $members,
  };
};

export const createTcpIpXml = (members: string[], enabled = true) => {
  const elem = createTcpIp(members, enabled);
  return toXML(elem);
};
