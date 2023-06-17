export const ChamberOfSecrets = ({ cos }) => {
  return (
    <div className="container-secretfile">
      <h4>CoS CID: {cos?.cid}</h4>
      <p>Decryption Time: {new Date(cos?.decryptionTime.toString()*1000).toISOString()}</p>
      <p>Chamber of Secrets:</p>
      <a href={`https://nftstorage.link/ipfs/${cos?.cid}`}>{`https://nftstorage.link/ipfs/${cos?.cid}`}</a>      
    </div>
  );
}
