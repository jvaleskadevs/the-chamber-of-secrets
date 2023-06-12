export const SecretFile = ({ file, decryptFile }) => {
  console.log(file);

  const decrypt = async () => {
    const decryptedFile = await decryptFile(file.encryptedString, file.encryptedSymmetricKey);
    console.log("DecryptedFile:");
    console.log(decryptedFile);
  }

  return (
    <div className="container-secretfile">
      {/*<h3>Filename: {file?.name}</h3>*/}
      {/*<p>Encrypted file: {file?.encryptedString}</p>*/}
      <p>SymmetricKey: {file?.encryptedSymmetricKey}</p>
      <button type="button" onClick={decrypt}>Decrypt</button>
    </div>
  );
}
