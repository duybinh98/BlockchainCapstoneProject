const AppConfig = {
    compilers: {
        solc: {
          version: "0.4.17",
        },
      },
      networks: {
        development: {
          host: "localhost",
          port: 9966,
          network_id: "*" // Match any network id
        }
      }
    
};

export default AppConfig;
