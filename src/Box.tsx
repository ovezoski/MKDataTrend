function Box({ shadow }: { shadow: string }) {
  return <div className={shadow + " box m-2 w-25 bg-white p-2"}></div>;
}

export default Box;
