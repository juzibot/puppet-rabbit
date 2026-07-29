import { FileBox, FileBoxInterface, FileBoxType } from "file-box"

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

/**
 * Normalize a FileBox into a form that survives JSON transport over MQ.
 * URL/Base64/QRCode boxes already serialize cleanly via toJSON; local and
 * stream boxes carry no inline bytes, so they are materialized to base64 first.
 */
export const toSerializableFileBox = async (file: FileBoxInterface): Promise<FileBoxInterface> => {
  switch (file.type) {
    case FileBoxType.Base64:
    case FileBoxType.Url:
    case FileBoxType.QRCode:
      return file
    default:
      return FileBox.fromBase64(await file.toBase64(), file.name)
  }
}