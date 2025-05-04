const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

AWS.config.update({ region: "ap-south-1" });

const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

module.exports.uploadProject = async (event) => {
  const bucketName = "rkconstructions-s3";

  try {
    // console.log("Received body:", event);
    const body = typeof event === "string" ? JSON.parse(event) : event;
    // console.log("Received body:", body);
    const projectName = body.Project_Name;

    if (!projectName) {
      throw new Error("Project_Name is required");
    }

    const folderName = `${projectName}`;

    const bannerImage = body.Banner_Image;
    const propertyImages = body.Property_Images;
    const projectVideo = body.Project_Video;
    const bannerKey = `${folderName}/banner_image.jpg`;

    await uploadBase64ToS3(bucketName, bannerKey, bannerImage, "image/jpeg");

    const propertyImageLinks = [];
    for (let i = 0; i < propertyImages.length; i++) {
      const imageKey = `${folderName}/property_images/image_${i + 1}.jpg`;
      await uploadBase64ToS3(
        bucketName,
        imageKey,
        propertyImages[i],
        "image/jpeg"
      );
      propertyImageLinks.push(
        `https://${bucketName}.s3.ap-south-1.amazonaws.com/${imageKey}`
      );
    }

    const videoKey = `${folderName}/project_video.mp4`;
    await uploadBase64ToS3(bucketName, videoKey, projectVideo, "video/mp4");

    const metadata = {
      Project_Name: body.Project_Name,
      Property_Description: body.Property_Description,
      Property_Location: body.Property_Location,
      Banner_Image_Link: `https://${bucketName}.s3.ap-south-1.amazonaws.com/${bannerKey}`,
      Property_Images_Links: propertyImageLinks,
      Project_Video_Link: `https://${bucketName}.s3.ap-south-1.amazonaws.com/${videoKey}`,
    };

    const metadataKey = `${folderName}/metadata.json`;
    await s3
      .putObject({
        Bucket: bucketName,
        Key: metadataKey,
        Body: JSON.stringify(metadata),
        ContentType: "application/json",
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Project uploaded successfully!",
        folder: folderName,
        metadataLink: `https://${bucketName}.s3.ap-south-1.amazonaws.com/${metadataKey}`,
      }),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to upload project",
        error: err.message,
      }),
    };
  }
};

async function uploadBase64ToS3(bucket, key, base64Data, contentType) {
  const buffer = Buffer.from(base64Data, "base64");

  await s3
    .putObject({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
    .promise();
}

// module.exports.getAllProjects = async (event) => {
//   const bucketName = "rkconstructions-s3";

//   try {
//     // List all objects in the root bucket
//     const listParams = {
//       Bucket: bucketName,
//       Delimiter: '/',
//     };

//     const listObjectsResponse = await s3.listObjectsV2(listParams).promise();

//     const projectFolders = listObjectsResponse.CommonPrefixes || [];

//     const allProjects = [];

//     for (const folder of projectFolders) {
      
//       const projectDataKey = `metadata.json`;

//       try {
//         const projectData = await s3.getObject({
//           Bucket: bucketName,
//           Key: projectDataKey,
//         }).promise();

//         const projectJson = JSON.parse(projectData.Body.toString('utf-8'));
//         allProjects.push(projectJson);

//       } catch (err) {
//         console.error(`Failed to fetch project data for ${folder.Prefix}`, err);
//         // Continue to next folder if one fails
//       }
//     }

//     return {
//       statusCode: 200,
//       body: JSON.stringify(allProjects),
//     };
//   } catch (err) {
//     console.error("Error listing projects:", err);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({
//         message: "Failed to fetch projects",
//         error: err.message,
//       }),
//     };
//   }
// };

// module.exports.getPresignedUrl = async (event) => {
//   const { fileName, contentType } = JSON.parse(event.body);

//   const bucketName = "rkconstructions-s3";
//   const key = `uploads/${Date.now()}-${fileName}`;

//   const params = {
//     Bucket: bucketName,
//     Key: key,
//     ContentType: contentType,
//     Expires: 60, // seconds
//   };

//   const url = s3.getSignedUrl("putObject", params);
//   const finalUrl = `https://${bucketName}.s3.amazonaws.com/${key}`;

//   return {
//     statusCode: 200,
//     headers: { "Access-Control-Allow-Origin": "*" },
//     body: JSON.stringify({ url, finalUrl }),
//   };
// };

