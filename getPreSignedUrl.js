const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

AWS.config.update({ region: "ap-south-1" });

const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

module.exports.getAllProjects = async (event) => {
    const bucketName = "rkconstructions-s3";
  
    try {
      const listParams = {
        Bucket: bucketName,
        Delimiter: '/',
      };
  
      const listObjectsResponse = await s3.listObjectsV2(listParams).promise();
      const projectFolders = listObjectsResponse.CommonPrefixes || [];
      const allProjects = [];
  
      for (const folder of projectFolders) {
        const projectDataKey = `${folder.Prefix}metadata.json`; // ✅ Correctly point to file inside the folder
  
        try {
          const projectData = await s3.getObject({
            Bucket: bucketName,
            Key: projectDataKey,
          }).promise();
  
          const projectJson = JSON.parse(projectData.Body.toString('utf-8'));
          allProjects.push(projectJson);
  
        } catch (err) {
          console.error(`Failed to fetch project data for ${projectDataKey}`, err);
          // Continue to next folder if one fails
        }
      }
  
      return {
        statusCode: 200,
        body: JSON.stringify(allProjects),
      };
    } catch (err) {
      console.error("Error listing projects:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Failed to fetch projects",
          error: err.message,
        }),
      };
    }
  };