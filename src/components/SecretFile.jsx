export const SecretFile = ({ file }) => {
  return (
    <div className="container-secretfile">
      <h4>New Filename: {file?.name}</h4>
      <p>Type: {file?.type}</p>
      <p>Encrypted file: {file?.ciphertext?.slice(0, 1200)}</p>
      
      <small>Showing only 1200 first characters of the encrypted file</small>
    </div>
  );
}
