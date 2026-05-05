const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const pool = require('../config/db');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'luxestates',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage });

exports.uploadImages = [
    upload.array('images', 10), // Limit to 10 images at once
    async (req, res) => {
        try {
            const { property_id } = req.body;
            const owner_id = req.user.userId;

            // Verify ownership
            const [ownerCheck] = await pool.query('SELECT owner_id FROM properties WHERE property_id = ?', [property_id]);
            if (ownerCheck.length === 0 || ownerCheck[0].owner_id !== owner_id) {
                return res.status(403).json({ error: 'Unauthorized to add photos to this property' });
            }

            const files = req.files;
            if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

            const values = files.map((file, index) => [property_id, file.path, index === 0]);
            
            await pool.query(
                'INSERT INTO property_images (property_id, image_url, sort_order) VALUES ?',
                [values]
            );

            res.json({ message: `${files.length} images uploaded to Cloudinary successfully`, files: values.map(v => v[1]) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
];
