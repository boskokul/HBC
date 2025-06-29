  export const dateToUnixTimestamp = (dateString: string): bigint => {
    const date = new Date(dateString);
    date.setUTCHours(0, 0, 0, 0);
    return BigInt(Math.floor(date.getTime() / 1000));
  };

  export const unixTimestampToDateString = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toISOString().split("T")[0];
  };