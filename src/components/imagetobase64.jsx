import React, { useState } from "react";

export default function ImageToSmallBase64() {
  const [base64, setBase64] = useState("");
  const [preview, setPreview] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.src = event.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // resize to 400x400
      canvas.width = 400;
      canvas.height = 400;

      ctx.drawImage(img, 0, 0, 400, 400);

      // compress jpeg quality
      const compressed = canvas.toDataURL("image/jpeg", 0.3);

      setBase64(compressed);
      setPreview(compressed);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div style={styles.container}>
      <h2>Small Base64 Converter</h2>

      <input type="file" accept="image/*" onChange={handleImageChange} />

      {preview && (
        <img src={preview} alt="preview" style={styles.image} />
      )}

      {base64 && (
        <textarea
          readOnly
          value={base64}
          style={styles.textarea}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: "20px auto",
    fontFamily: "Arial",
  },
  image: {
    width: 100,
    marginTop: 20,
    borderRadius: 8,
  },
  textarea: {
    width: "100%",
    height: 200,
    marginTop: 20,
    fontSize: 11,
    fontFamily: "monospace",
  },
};