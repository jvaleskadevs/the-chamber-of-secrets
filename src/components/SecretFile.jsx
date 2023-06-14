export const SecretFile = ({ file, decryptFile, decryptedFileAsUrl }) => {
  console.log(file);

  const decrypt = async () => {
    await decryptFile(file.encryptedFile, file.encryptedSymmetricKey);
  }

  return (
    <div className="container-secretfile">
      <h4>Filename: {file?.name}</h4>
      <p>Encrypted file: {file?.encryptedFileAsString}</p>
      <p>SymmetricKey: {file?.encryptedSymmetricKey}</p>
      <p>Size: {file?.size}</p>
      <button type="button" onClick={decrypt}>Decrypt</button>
      
      { decryptedFileAsUrl && (
        <>  
          <p>The file has been successfully decrypted as URL (base64):</p>
          <a href={decryptedFileAsUrl}>{decryptedFileAsUrl}</a>
        </>
      )}
    </div>
  );
}
