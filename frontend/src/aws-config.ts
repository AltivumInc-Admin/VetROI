// AWS Amplify Configuration for VetROI DD214 Upload
export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_zVjrLf0jA',
      userPoolClientId: '76n50up630j138tco47ebg9ml3',
      identityPoolId: 'us-east-2:10f0038f-acb9-44c2-a433-c9aa12185217',
      signUpVerificationMethod: 'code' as const
    }
  },
  Storage: {
    S3: {
      bucket: 'vetroi-dd214-secure',
      region: 'us-east-2'
    }
  }
}