import { FileBoxInterface, FileBoxType } from "file-box"

export const stringifyFileBox = (file: FileBoxInterface) => {
  switch (file.type) {
    case FileBoxType.Base64:
    case FileBoxType.Url:
    case FileBoxType.QRCode:
      return JSON.stringify(file)
    default:
      throw new Error(`Unsupported filebox type: ${file.type}`)
  }
}