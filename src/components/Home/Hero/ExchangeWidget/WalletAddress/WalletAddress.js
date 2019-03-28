import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { errorAlert, setWallet, selectCoin, fetchPrice } from 'Actions/index.js';
import validateWalletAddress from 'Utils/validateWalletAddress';
import AddressHistory from './AddressHistory/AddressHistory';
import styles from './WalletAddress.scss';
import { I18n } from 'react-i18next';
import i18n from '../../../../../i18n';

import urlParams from 'Utils/urlParams';


class WalletAddress extends Component {
  constructor(props) {
    super(props);

    this.state = { address: '', firstLoad: true , orderHistory: []};
    this.handleChange = this.handleChange.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.setAddress = this.setAddress.bind(this);
    this.setCoin = this.setCoin.bind(this);
  }

  validate = (address, receiveCoin) => {
    if (address === '' || !receiveCoin) {
      this.props.setWallet({
        address,
        valid: false,
      });

      return this.props.errorAlert({ show: false });
    }

    const valid = validateWalletAddress(
      address,
      receiveCoin,
      () =>
        this.props.errorAlert({
          show: true,
          message: `${address} ${i18n.t('error.novalid')} ${receiveCoin} ${i18n.t('generalterms.address')}.`,
        }),
      () => this.props.errorAlert({ show: false })
    );

    this.props.setWallet({
      address,
      valid,
    });
  };

  handleChange(event) {
    const address = event.target.value.replace(new RegExp(/ /g, 'g'), '');
    this.setState({ address });
    this.validate(address, this.props.selectedCoin.receive);
  }

  handleFocus(event) {
    let orderHistory = localStorage['orderHistory'];
    try {
      //Most recent order for each address
      orderHistory = orderHistory ? _.uniqBy(JSON.parse(orderHistory).reverse(), 'withdraw_address') : [];
    } catch (e) {
      orderHistory = [];
    }
    this.setState({
      orderHistory: orderHistory
    });
  }

  handleBlur(event) {
    this.setState({
      orderHistory: []
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.onSubmit();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.selectedCoin.receive !== this.props.selectedCoin.receive) {
      this.validate(this.state.address, nextProps.selectedCoin.receive);
    }
  }

  componentDidUpdate(){
    //Check if withdraw_address url param exists. If exists, prefill address field with that value
    const params = urlParams();
    if (params && params.hasOwnProperty('withdraw_address') && !this.props.wallet.address
      && this.props.selectedCoin.receive && this.state.firstLoad) {
        const simulatedEvent ={target: {value: params['withdraw_address'].toString()}};
        this.handleChange(simulatedEvent);
        this.setState({firstLoad: false});
        this.props.button.focus();
      }
  }

  setAddress(address) {
    const simulatedEvent ={target: {value: address}};
    this.handleChange(simulatedEvent);
    this.props.button.focus();
  }

  setCoin(coin) {
    //Select coin
    this.props.selectCoin({
      ...this.props.selectedCoin,
      ['receive']: coin,
    }, this.props.pairs);

    //Update quote value
    const pair = `${coin}${this.props.selectedCoin.deposit}`;
    const data = {
      pair,
      lastEdited: 'receive',
    };

    data['receive'] = coin;
    this.props.fetchPrice(data);
  }

  render() {
    let coin = this.props.selectedCoin.receive ? this.props.selectedCoin.receive : '...';
    return (
      <I18n ns="translations">
        {t => (
          <div className="col-xs-12 active">
            <form className="form-group" onSubmit={this.handleSubmit}>
              <input
                type="text"
                ref={this.props.inputRef}
                className={`form-control ${styles.input}`}
                id="withdraw-addr"
                onChange={this.handleChange}
                onFocus={this.handleFocus}
                onBlur={this.handleBlur}
                value={this.state.address}
                autoComplete="off"
                placeholder={t('generalterms.youraddress', { selectedCoin: coin })}
              />
              <AddressHistory history={this.state.orderHistory} setAddress={this.setAddress} setCoin={this.setCoin} />
            </form>
          </div>
        )}
      </I18n>
    );
  }
}

const mapStateToProps = ({ selectedCoin, wallet, pairs }) => ({ selectedCoin, wallet, pairs });
const mapDispatchToProps = dispatch => bindActionCreators({ errorAlert, setWallet, selectCoin, fetchPrice }, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletAddress);
