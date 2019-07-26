import * as React from 'react'
import { remote } from 'electron'
import { CSSTransition } from 'react-transition-group'
import Modal from './Modal'
import { ApiAction } from '../../store/api'
import TextInput from '../form/TextInput'
import SelectInput from '../form/SelectInput'
import Error from './Error'
import Buttons from './Buttons'
import Tabs from './Tabs'
import ButtonInput from '../form/ButtonInput'

import { ISelectOption } from '../../models/forms'

const formatOptions: ISelectOption[] = [
  { name: 'csv', value: 'csv' },
  { name: 'json', value: 'json' },
  { name: 'xlsx', value: 'xlsx' },
  { name: 'cbor', value: 'cbor' }
]

enum TabTypes {
  NewBody = 'Create new datafile',
  ExistingBody = 'Use existing file',
}

interface CreateDatasetProps {
  onDismissed: () => void
  onSubmit: (path: string, name: string, format: string) => Promise<ApiAction>
}

const CreateDataset: React.FunctionComponent<CreateDatasetProps> = ({ onDismissed, onSubmit }) => {
  const [datasetName, setDatasetName] = React.useState('')
  const [path, setPath] = React.useState('')
  const [bodyFormat, setBodyFormat] = React.useState(formatOptions[0].value)
  const [bodyPath, setBodyPath] = React.useState('')
  const [activeTab, setActiveTab] = React.useState(TabTypes.NewBody)
  const [dismissable, setDismissable] = React.useState(true)
  const [buttonDisabled, setButtonDisabled] = React.useState(true)
  const [alreadyDatasetError, setAlreadyDatasetError] = React.useState('')

  // should come from props
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    toggleButton(activeTab)
    if (error !== '') setError('')
  }, [path, bodyFormat, bodyPath, datasetName, activeTab])

  // should come from props/actions that has us check if the directory already contains a qri dataset
  const isQriDataset = (path: string) => !path

  // call this whenever we need to check if the button should be disabled
  const toggleButton = (activeTab: TabTypes) => {
    if (!(datasetName && path)) {
      setButtonDisabled(true)
      return
    }
    if ((activeTab === TabTypes.ExistingBody && bodyPath === '') ||
        (activeTab === TabTypes.NewBody && bodyFormat === '')) {
      setButtonDisabled(true)
      return
    }
    setButtonDisabled(false)
  }

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
    const directory: string[] | undefined = remote.dialog.showOpenDialog(window, {
      properties: ['createDirectory', 'openFile'],
      filters: [{ name: 'Data', extensions: ['csv', 'json', 'xlsx', 'cbor'] }]
    })

    if (!directory) {
      return
    }

    const path = directory[0]

    setBodyPath(path)
  }

  const handlePickerDialog = (showFunc: () => void) => {
    new Promise(resolve => {
      setDismissable(false)
      resolve()
    })
      .then(() => showFunc())
      .then(() => setDismissable(true))
  }

  const renderCreateDataset = () => {
    return (
      <div className='margin-bottom'>
        <TextInput
          name='datasetName'
          label='Dataset Name:'
          type=''
          value={datasetName}
          onChange={handleChanges}
          maxLength={300}
        />
        <div className='flex-space-between'>
          <TextInput
            name='path'
            label='Local Path:'
            type=''
            value={path}
            onChange={handleChanges}
            maxLength={600}
            errorText={alreadyDatasetError}
          />
          <div className='margin-left'><ButtonInput onClick={() => handlePickerDialog(showDirectoryPicker)} >Choose...</ButtonInput></div>
        </div>
      </div>
    )
  }

  const handleChanges = (name: string, value: any) => {
    if (value[value.length - 1] === ' ') {
      return
    }
    if (name === 'datasetName') setDatasetName(value)
    if (name === 'path') {
      setPath(value)
      setAlreadyDatasetError('')
    }
    if (name === 'format') setBodyFormat(value)
    if (name === 'bodyPath') setBodyPath(value)
  }

  const renderTabs = () => {
    // return <Tabs tabs={[TabTypes.NewBody, TabTypes.ExistingBody]} active={activeTab} onClick={(activeTab: TabTypes) => setActiveTab(activeTab)}/>
    return <Tabs tabs={[TabTypes.NewBody]} active={activeTab} onClick={(activeTab: TabTypes) => setActiveTab(activeTab)}/>
  }

  const renderCreateNewBody = () =>
    <CSSTransition
      in={ activeTab === TabTypes.NewBody }
      classNames="fade"
      component="div"
      timeout={300}
      unmountOnExit
    >
      <div className='content'>
        <SelectInput
          name='format'
          label='Choose format:'
          options={formatOptions}
          value={bodyFormat}
          onChange={handleChanges}
        />
      </div>
    </CSSTransition>

  const renderUseExistingBody = () =>
    <CSSTransition
      in={ activeTab === TabTypes.ExistingBody }
      classNames="fade"
      component="div"
      timeout={300}
      unmountOnExit
    >
      <div className='content flex-space-between'>
        <TextInput
          name='bodyPath'
          label='Path to datafile:'
          type=''
          helpText='data file can be csv, json, xlsx, or cbor'
          showHelpText
          value={bodyPath}
          onChange={handleChanges}
          maxLength={600}
        />
        <div className='margin-left'><ButtonInput onClick={() => handlePickerDialog(showFilePicker)} >Choose...</ButtonInput></div>
      </div>
    </CSSTransition>

  const handleSubmit = () => {
    setDismissable(false)
    setLoading(true)
    // should fire off action and catch error response
    // if success, fetchDatatsets
    if (!onSubmit) return
    onSubmit(path, datasetName, bodyFormat)
      .then(() => onDismissed())
      .catch((action) => {
        setLoading(false)
        setError(action.payload.err.message)
      })
  }

  return (
    <Modal
      id="CreateDataset"
      title={'Create Dataset'}
      onDismissed={onDismissed}
      onSubmit={() => {}}
      dismissable={dismissable}
      setDismissable={setDismissable}
    >
      <div>
        {renderCreateDataset()}
        <hr />
        {renderTabs()}
        <div id='create-dataset-content-wrap' className='content-wrap'>
          {renderCreateNewBody()}
          {renderUseExistingBody()}
        </div>
        <Error text={error} />
      </div>
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