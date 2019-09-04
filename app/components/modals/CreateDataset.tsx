import * as React from 'react'
import { remote } from 'electron'
import Modal from './Modal'
import { ApiAction } from '../../store/api'
import TextInput from '../form/TextInput'
import Error from './Error'
import Buttons from './Buttons'
// import Tabs from './Tabs'
import ButtonInput from '../form/ButtonInput'

interface CreateDatasetProps {
  onDismissed: () => void
  onSubmit: (path: string, name: string, format: string) => Promise<ApiAction>
  setWorkingDataset: (peername: string, name: string, isLinked: boolean, published: boolean) => Promise<ApiAction>
  fetchMyDatasets: () => Promise<ApiAction>
}

// setWorkingDataset
const CreateDataset: React.FunctionComponent<CreateDatasetProps> = ({ onDismissed, onSubmit, setWorkingDataset, fetchMyDatasets }) => {
  const [datasetName, setDatasetName] = React.useState('')
  const [path, setPath] = React.useState('')
  const [filePath, setFilePath] = React.useState('')

  const [dismissable, setDismissable] = React.useState(true)
  const [buttonDisabled, setButtonDisabled] = React.useState(true)
  const [alreadyDatasetError, setAlreadyDatasetError] = React.useState('')

  React.useEffect(() => {
    // disable unless all fields have valid
    const ready = path !== '' && filePath !== '' && datasetName !== ''
    setButtonDisabled(!ready)
  }, [datasetName, path, filePath])

  // should come from props
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  // should come from props/actions that has us check if the directory already contains a qri dataset
  const isQriDataset = (path: string) => !path

  const showDirectoryPicker = () => {
    const window = remote.getCurrentWindow()
    const directory: string[] | undefined = remote.dialog.showOpenDialog(window, {
      properties: ['createDirectory', 'openDirectory']
    })

    if (!directory) {
      return
    }

    const path = directory[0]

    setPath(path)
    const isDataset = isQriDataset(path)
    if (isDataset) {
      setAlreadyDatasetError('A dataset already exists in this directory.')
      setButtonDisabled(true)
    }
  }

  const showFilePicker = () => {
    const window = remote.getCurrentWindow()
    const filePath: string[] | undefined = remote.dialog.showOpenDialog(window, {
      properties: ['openFile']
    })

    if (!filePath) {
      return
    }

    const path = filePath[0]

    setFilePath(path)
    const isDataset = isQriDataset(path)
    if (isDataset) {
      setAlreadyDatasetError('A dataset already exists in this directory.')
      setButtonDisabled(true)
    }
  }

  const handleFilePickerDialog = (showFunc: () => void) => {
    new Promise(resolve => {
      setDismissable(false)
      resolve()
    })
      .then(() => showFunc())
      .then(() => setDismissable(true))
  }

  const handlePathPickerDialog = (showFunc: () => void) => {
    new Promise(resolve => {
      setDismissable(false)
      resolve()
    })
      .then(() => showFunc())
      .then(() => setDismissable(true))
  }

  const handleChanges = (name: string, value: any) => {
    if (value[value.length - 1] === ' ') {
      return
    }

    if (name === 'datasetName') {
      setDatasetName(value)
      setAlreadyDatasetError('')
    }
  }

  const handleSubmit = () => {
    setDismissable(false)
    setLoading(true)
    error && setError('')
    if (!onSubmit) return
    onSubmit(filePath, datasetName, `${path}/${datasetName}`)
      .then(({ peername, name, isLinked, published }) => {
        onDismissed()
        setWorkingDataset(peername, name, isLinked, published)
        fetchMyDatasets()
      })
      .catch((action: any) => {
        setLoading(false)
        setDismissable(true)
        setError(action.payload.err.message)
      })
  }

  return (
    <Modal
      id="CreateDataset"
      title={'New Dataset'}
      onDismissed={onDismissed}
      onSubmit={() => {}}
      dismissable={dismissable}
      setDismissable={setDismissable}
    >
      <div className='content-wrap'>
        <div className='content'>
          <TextInput
            name='datasetName'
            label='Dataset Name'
            type=''
            value={datasetName}
            onChange={handleChanges}
            maxLength={600}
            errorText={alreadyDatasetError}
          />
          <div className='flex-space-between'>
            <TextInput
              name='path'
              label='Data file'
              type=''
              value={filePath}
              onChange={handleChanges}
              maxLength={600}
              errorText={alreadyDatasetError}
            />
            <div className='margin-left'><ButtonInput onClick={() => handleFilePickerDialog(showFilePicker)} >Choose...</ButtonInput></div>
          </div>
          <div className='flex-space-between'>
            <TextInput
              name='path'
              label='Save Path'
              type=''
              value={path}
              onChange={handleChanges}
              maxLength={600}
              errorText={alreadyDatasetError}
            />
            <div className='margin-left'><ButtonInput onClick={() => handlePathPickerDialog(showDirectoryPicker)} >Choose...</ButtonInput></div>
          </div>
        </div>
      </div>

      <p className='submit-message'>
        {!buttonDisabled && (
          <span>Qri will create the directory {path}/{datasetName} and import your data file</span>
        )}
      </p>
      <Error text={error} />
      <Buttons
        cancelText='cancel'
        onCancel={onDismissed}
        submitText='Create Dataset'
        onSubmit={handleSubmit}
        disabled={buttonDisabled}
        loading={loading}
      />
    </Modal>
  )
}

export default CreateDataset
