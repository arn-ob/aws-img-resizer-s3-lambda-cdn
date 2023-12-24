const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3();

function paths (paths){
    
    const pathA = paths?.pathA;
    const pathB = paths?.pathB;
    const pathC = paths?.pathC;

    let _var_key = "";

    if(pathA) {
        _var_key = pathA;
    }
    if(pathB) {
        _var_key = pathA + "/" + pathB;
    }
    if(pathC) {
        _var_key = pathA + "/" + pathB + "/" + pathC;
    }

    return _var_key;
}

async function resizeImage({ file, width = null, height = null, quality = 100 }) {

    if (width) {
        width = parseInt(width);
    }
    if (height) {
        height = parseInt(height);
    }
    if (quality) {
        quality = parseInt(quality);
    }

    let _image;
    if (String(file).includes('.png')) {
        console.log('png')
        _image = await sharp(file)
            .resize(width, height)
            .png({ quality: quality })
            .toBuffer();
    } else if (String(file).search('.jpg')) {
        console.log('png')
        _image = await sharp(file)
            .resize(width, height)
            .jpeg({ quality: quality })
            .toBuffer();
    } else {
        console.log('any')
        _image = await sharp(file)
            .resize(width, height)
            .toBuffer();
    }

    return _image;
}

exports.handler = async (event, context) => {

  console.log('event', event)
  console.log('context', context)

  const bucketName = 'img-resizer-v1';

  // query string params
  const height_params = event?.queryStringParameters?.h;
  const width_params = event?.queryStringParameters?.w;
  const quality_params = event?.queryStringParameters?.q;

  // path params
  let image_key = paths(event?.pathParameters);

  try {
    const params = {
      Bucket: bucketName,
      Key: image_key,
    };

    const s3Object = await s3.getObject(params).promise();

    if (!s3Object || !s3Object.Body) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Image not found' })
      };
    }

    let _image = s3Object.Body;

    _image = await resizeImage({
      file: _image, 
      width: width_params,
      height: height_params,
      quality: quality_params
    });

    const image_data = Buffer.from(_image, 'binary').toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/jpeg' // Adjust content type based on your image type
      },
      isBase64Encoded: true, 
      body: image_data
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error.message)
    };
  }
}