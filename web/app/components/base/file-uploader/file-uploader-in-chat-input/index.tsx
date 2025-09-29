import {
  memo,
} from 'react'
import {
  RiAttachmentLine,
} from '@remixicon/react'
import FileInput from '../file-input'
import ActionButton from '@/app/components/base/action-button'
import type { FileUpload } from '@/app/components/base/features/types'
import { TransferMethod } from '@/types/app'

type FileUploaderInChatInputProps = {
  fileConfig: FileUpload
}
const FileUploaderInChatInput = ({
  fileConfig,
}: FileUploaderInChatInputProps) => {
  const showFromLocal = fileConfig?.allowed_file_upload_methods?.includes(TransferMethod.local_file)

  if (!showFromLocal) {
    return null
  }

  return (
    <ActionButton
      size='l'
      className='relative'
    >
      <RiAttachmentLine className='h-5 w-5' />
      <FileInput fileConfig={fileConfig} />
    </ActionButton>
  )
}

export default memo(FileUploaderInChatInput)
