import PropTypes from 'prop-types'
import { connect } from 'react-redux'
const Alert = ({ alerts }) =>
  alerts != null &&
  alerts.length > 0 &&
  alerts.map((el) => (
    <div key={el.id} className={`alert alert-${el.alertType}`}>
      {el.msg}
    </div>
  ))
Alert.propTypes = {
  alerts: PropTypes.array.isRequired,
}
const mapStatetoProps = (state) => ({
  alerts: state.alert,
})
export default connect(mapStatetoProps)(Alert)
