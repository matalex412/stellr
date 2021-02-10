const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const mkdirp = require("mkdirp");
const vision = require("@google-cloud/vision");
const spawn = require("child-process-promise").spawn;
const path = require("path");
const os = require("os");
const fs = require("fs");
const UUID = require("uuid-v4");

const VERY_UNLIKELY = "VERY_UNLIKELY";
const BLURRED_FOLDER = "blurred";

exports.sanitizeImage = functions.storage
    .object()
    .onFinalize(async (object) => {
        if (object.name.startsWith(`${BLURRED_FOLDER}/`)) {
            console.log(`Ignoring upload "${object.name}"`);
            return null;
        }

        // Check the image content using the Cloud Vision API.
        const visionClient = new vision.ImageAnnotatorClient();
        const [data] = await visionClient.safeSearchDetection(
            `gs://${object.bucket}/${object.name}`
        );

        const detections = data.safeSearchAnnotation;
        if (
            detections.adult !== VERY_UNLIKELY ||
			detections.spoof !== VERY_UNLIKELY ||
			detections.medical !== VERY_UNLIKELY ||
			detections.violence !== VERY_UNLIKELY ||
			detections.racy !== VERY_UNLIKELY
        ) {
            console.log("Offensive image found. Blurring.");
            return blurImage(object.name, object.bucket, object.metadata);
        }

        return null;
    });

async function blurImage(filePath, bucketName, metadata) {
    const tempLocalFile = path.join(os.tmpdir(), filePath);
    const tempLocalDir = path.dirname(tempLocalFile);
    const bucket = admin.storage().bucket(bucketName);
    const uuid = UUID();

    try {
        // Create the temp directory where the storage file will be downloaded.
        await mkdirp(tempLocalDir);
        console.log("Temporary directory has been created", tempLocalDir);

        // Download file from bucket.
        await bucket.file(filePath).download({destination: tempLocalFile});
        console.log("The file has been downloaded to", tempLocalFile);

        // Blur the image using ImageMagick.
        await spawn("convert", [
            tempLocalFile,
            "-channel",
            "RGBA",
            "-blur",
            "0x8",
            tempLocalFile,
        ]);
        console.log("Blurred image created at", tempLocalFile);

        // Uploading the Blurred image.
        await bucket
            .upload(tempLocalFile, {
                destination: `${BLURRED_FOLDER}/${filePath}`,
                metadata: {contentType: "image/jpeg"},
            })
            .then(async (data) => {
                const file = data[0];
                const downloadUrl =
					"https://firebasestorage.googleapis.com/v0/b/" +
					bucket.name +
					"/o/" +
					encodeURIComponent(file.name) +
					"?alt=media&token=" +
					uuid;

                const editPath = filePath.split("/");
                const name = editPath[editPath.length - 1];
                editPath.pop();

                if (editPath[0] == "users") {
                    admin
                        .firestore()
                        .collection(editPath[0])
                        .doc(editPath[1])
                        .update({
                            profilePic: downloadUrl,
                        });
                } else if (name == "Thumbnail") {
                    admin
                        .firestore()
                        .collection(`${editPath[0]}/${editPath[1]}/posts`)
                        .doc(editPath[editPath.length - 1])
                        .update({
                            thumbnail: downloadUrl,
                        });
                } else {
                    const doc = await admin
                        .firestore()
                        .collection(`${editPath[0]}/${editPath[1]}/posts`)
                        .doc(editPath[2])
                        .get();
                    const post = doc.data();

                    post.steps[editPath[4]]["Images"] = downloadUrl;

                    admin
                        .firestore()
                        .collection(`${editPath[0]}/${editPath[1]}/posts`)
                        .doc(editPath[2])
                        .update({
                            steps: post.steps,
                        });
                }
            });

        console.log("Blurred image uploaded to Storage at", filePath);

        // Clean up the local file
        fs.unlinkSync(tempLocalFile);
        console.log("Deleted local file", filePath);
    } catch (error) {
        console.log(error);
    }
}
