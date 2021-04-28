// See: https://www.christopherbiscardi.com/how-to-create-a-custom-cdk-construct

import * as cdk from "@aws-cdk/core";

export default class OrientDbConstruct extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);
    //...
  }
}
