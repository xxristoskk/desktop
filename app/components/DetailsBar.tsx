import * as React from 'react'
import { Details, DetailsType, StatsDetails } from '../models/details'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import Stat from './stats/Stat'

export interface DetailsBarProps {
  details: Details
  setDetailsBar: (details: Details) => void
}
const DetailsBar: React.FunctionComponent<DetailsBarProps> = (props) => {
  const {
    details,
    setDetailsBar
  } = props
  console.log(details)

  const renderStatsDetails = () => {
    const statsDetails = details as StatsDetails
    return (
      <div>
        <h4>{statsDetails.title}</h4>
        <p>{statsDetails.stats.type}</p>
        <Stat data={details.stats} />
      </div>
    )
  }

  const onDismiss = () => {
    setDetailsBar({ type: DetailsType.NoDetails })
  }

  const renderHeader = () =>
    <div className="details-bar-header">
      <h3>Details</h3>
      <a
        className="close"
        onClick={onDismiss}
        aria-label="close"
        role="button"
      >
        <FontAwesomeIcon icon={faTimes} size='lg'/>
      </a>
    </div>

  return <div className='details-bar padding'>
    {renderHeader()}
    <div className="details-bar-content margin">
      {details.type === DetailsType.StatsDetails && renderStatsDetails()}
    </div>
  </div>
}

export default DetailsBar
