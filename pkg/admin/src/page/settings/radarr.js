import React from "react";
import Api from "../../data/Api";

import { v4 as uuidv4 } from "uuid";

import { ReactComponent as Add } from "../../assets/svg/plus-circle.svg";
import { ReactComponent as ServerIcon } from "../../assets/svg/server.svg";

import { ReactComponent as Spinner } from "../../assets/svg/spinner.svg";
import Modal from "../../components/Modal";

class Radarr extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      servers: false,
      loading: true,
      isError: false,
      isMsg: false,
      wizardOpen: false,
      enabled: false,
      title: "",
      protocol: "http",
      host: "localhost",
      port: 7878,
      profile: {
        id: null,
        name: null,
      },
      path: {
        id: null,
        location: null,
      },
      language: {
        id: null,
        name: null,
      },
      subpath: "/",
      key: "",
      activeServer: false,
      uuid: '',
      needsTest: false,
    };

    this.inputChange = this.inputChange.bind(this);
    this.getRadarr = this.getRadarr.bind(this);
    this.saveServer = this.saveServer.bind(this);
    this.deleteServer = this.deleteServer.bind(this);
    this.openWizard = this.openWizard.bind(this);
    this.closeWizard = this.closeWizard.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.getSettings = this.getSettings.bind(this);

    this.closeMsg = false;
  }

  async saveServer(silent = false) {
    if (this.state.activeServer === false) {
      console.log("error");
      return;
    }
    let servers = this.state.servers;

    servers[this.state.activeServer] = {
      enabled: this.state.enabled,
      title: this.state.title,
      protocol: this.state.protocol,
      host: this.state.host,
      key: this.state.key,
      port: this.state.port,
      subpath: this.state.subpath === "/" ? "" : this.state.subpath,
      path: {
        id: this.state.path.id,
        location: this.state.path.location,
      },
      profile: {
        id: this.state.profile.id,
        name: this.state.profile.name,
      },
      language: {
        id: this.state.language.id,
        name: this.state.language.name,
      },
      uuid: this.state.uuid,
    };

    await Api.saveRadarrConfig(servers);
    await this.getRadarr(true);

    if (!silent) {
      this.props.msg({
        message: "Radarr settings saved!",
        type: "good",
      });
    }
  }

  async deleteServer(silent = false) {
    if (this.state.activeServer === false) {
      this.props.msg({
        message: "something went wrong",
        type: "error",
      });
      return;
    }

    let servers = this.state.servers;

    let res = await Api.radarrDeleteInstance(servers[this.state.activeServer].uuid);
    if (res.status == "error") {
      this.props.msg({
        message: res.error,
        type: "error",
      });
      return;
    }

    servers.splice(this.state.activeServer, 1);
    this.getRadarr(true);

    if (!silent) {
      this.closeModal("addServer");
      this.closeWizard();

      this.props.msg({
        message: res.message,
        type: "good",
      });
    }
  }

  async test(id, add = false) {
    if (!this.state.subpath.startsWith("/") && this.state.subpath.length > 0) {
      this.setState({
        subpath: "/" + this.state.subpath,
      });
      setTimeout(() => {
        this.test(id, add);
      }, 1000);
      return;
    }
    if (add) {
      await this.saveServer(true);
    }
    try {
      let result = await Api.testRadarr(id);
      if (result.connection) {
        this.setState({
          newServer: false,
          needsTest: false,
        });
        this.props.msg({
          message: "Radarr Test Connection success!",
          type: "good",
        });
        await this.getRadarr(true);
        await this.getSettings(id);
      } else {
        this.props.msg({
          message: "Radarr Test Connection failed!",
          type: "error",
        });

        this.deleteServer(true);
      }
    } catch (err) {
      this.props.msg({
        message: "Radarr Test Connection failed! Error 2",
        type: "error",
      });
    }
  }

  inputChange(e) {
    const target = e.target;
    const name = target.name;
    let value = target.value;

    if (target.classList.contains("frt")) {
      this.setState({
        needsTest: true,
        enabled: false,
      });
    }

    if (target.type === "checkbox") {
      value = target.checked;
    }

    if (target.type === "select-one") {
      let title = target.options[target.selectedIndex].text;
      if (this.state[name] instanceof Object) {
        this.setState({
          [`${name}`]: {
            id: value,
            [this.state[name].name != undefined ? 'name' : 'location']: title,
          },
        });
      } else {
        this.setState({
          [name]: value,
        });
      }
    } else {
      this.setState({
        [name]: value,
      });
    }
  }

  async getRadarr(live = false) {
    this.setState({
      loading: live ? false : true,
    });
    try {
      let radarr = await Api.radarrConfig();
      this.setState({
        servers: radarr,
        loading: false,
      });
    } catch (err) {
      console.log(err);
      this.setState({
        loading: false,
      });
    }
  }

  componentDidMount() {
    this.getRadarr();
  }

  componentWillUnmount() {
    clearInterval(this.closeMsg);
  }

  openWizard(id) {
    if (this.state.servers[id]) {
      this.setState({
        newServer: false,
        editWizardOpen: true,
        activeServer: id,
        enabled: this.state.servers[id].enabled,
        title: this.state.servers[id].title,
        protocol: this.state.servers[id].protocol,
        host: this.state.servers[id].host,
        port: this.state.servers[id].port,
        subpath: this.state.servers[id].subpath,
        key: this.state.servers[id].key,
        profile: {
          id: this.state.servers[id].profile.id,
          name: this.state.servers[id].profile.name,
        },
        path: {
          id: this.state.servers[id].path.id,
          location: this.state.servers[id].path.location
        },
        language: {
          id: this.state.servers[id].language.id,
          name: this.state.servers[id].language.name,
        },
        uuid: this.state.servers[id].uuid,
        needsTest: false,
      });
      this.getSettings(this.state.servers[id].uuid);
    } else {
      this.setState({
        newServer: true,
        wizardOpen: true,
        activeServer: id,
        uuid: uuidv4(),
        needsTest: true,
      });
    }
  }

  closeWizard() {
    this.setState({
      enabled: false,
      title: "",
      protocol: "http",
      host: "localhost",
      port: 7878,
      subpath: "/",
      key: "",
      profiles: false,
      paths: false,
      path: {
        id: null,
        location: null,
      },
      profile: {
        id: null,
        name: null,
      },
      language: {
        id: null,
        name: null,
      },
      wizardOpen: false,
      editWizardOpen: false,
      activeServer: false,
      uuid: '',
      newServer: false,
    });
  }

  openModal(id) {
    this.setState({
      [`${id}Open`]: true,
      needsTest: false,
    });
  }

  closeModal(id) {
    this.setState({
      [`${id}Open`]: false,
      enabled: false,
      title: "",
      protocol: "http",
      host: "localhost",
      port: null,
      subpath: "",
      key: "",
      profiles: false,
      paths: false,
      path: {
        id: null,
        location: null,
      },
      profile: {
        id: null,
        name: null,
      },
      language: {
        id: null,
        name: null,
      },
      wizardOpen: false,
      editWizardOpen: false,
      activeServer: false,
      uuid: false,
    });
  }

  async getSettings(uuid) {
    try {
      let settings = await Api.radarrOptions(uuid);
      if (settings.profiles.error || settings.paths.error) {
        return;
      }
      if (this.state.uuid === uuid)
        this.setState({
          profiles: settings.profiles.length > 0 ? settings.profiles : false,
          paths: settings.paths.length > 0 ? settings.paths : false,
          languages: settings.languages.length > 0 ? settings.languages : false,
        });
    } catch {
      return;
    }
  }

  render() {
    let serverCount = 0;
    if (this.state.loading) {
      return (
        <>
          <div className="spinner--settings">
            <Spinner />
          </div>
        </>
      );
    }

    return (
      <>
        <Modal
          title="Add new server"
          open={this.state.addServerOpen}
          submitText="Save"
          submit={
            this.state.needsTest
              ? false
              : () => {
                this.saveServer();
                this.closeModal("addServer");
              }
          }
          close={() => this.closeModal("addServer")}
          delete={
            this.state.newServer
              ? false
              : () => {
                this.deleteServer();
                this.closeModal("addServer");
              }
          }
        >
          <label>Title</label>
          <input
            className="styled-input--input"
            type="text"
            name="title"
            value={this.state.title}
            onChange={this.inputChange}
          />
          <label>Protocol</label>
          <div className="styled-input--select">
            <select
              name="protocol"
              value={this.state.protocol}
              onChange={this.inputChange}
              className="frt"
            >
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </select>
          </div>
          <label>Host</label>
          <input
            className="styled-input--input frt"
            type="text"
            name="host"
            value={this.state.host}
            onChange={this.inputChange}
          />
          <label>Port</label>
          <input
            className="styled-input--input frt"
            type="number"
            name="port"
            value={this.state.port ? this.state.port : 7878}
            onChange={this.inputChange}
          />
          <label>URL Base</label>
          <input
            className="styled-input--input frt"
            type="text"
            name="subpath"
            value={this.state.subpath ? this.state.subpath : '/'}
            onChange={this.inputChange}
          />
          <label>API Key</label>
          <input
            className="styled-input--input frt"
            type="text"
            name="key"
            value={this.state.key ? this.state.key : ''}
            onChange={this.inputChange}
          />
          <button
            className="btn btn__square mb--1"
            onClick={() => this.test(this.state.uuid, true)}
          >
            Test
          </button>
          <label>Profile</label>
          <div
            className={`styled-input--select ${this.state.profiles ? "" : "disabled"
              }`}
          >
            <select
              name="profile"
              value={this.state.profile.id}
              onChange={this.inputChange}
            >
              {this.state.profiles &&
                !this.state.newServer &&
                !this.state.needsTest ? (
                <>
                  <option value="">Choose an option</option>
                  {this.state.profiles.map((item) => {
                    return (
                      <option key={`p__${item.id}`} value={item.id}>
                        {item.name}
                      </option>
                    );
                  })}
                </>
              ) : (
                <option value="">
                  {this.state.newServer || this.state.needsTest
                    ? "Please test connection"
                    : "Loading..."}
                </option>
              )}
            </select>
          </div>
          <label>Path</label>
          <div
            className={`styled-input--select ${this.state.profiles ? "" : "disabled"
              }`}
          >
            <select
              name="path"
              value={this.state.path.id}
              onChange={this.inputChange}
            >
              {this.state.paths && !this.state.needsTest ? (
                <>
                  <option value="">Choose an option</option>
                  {this.state.paths.map((item) => {
                    return (
                      <option key={`pp__${item.id}`} value={item.id}>
                        {item.path}
                      </option>
                    );
                  })}
                </>
              ) : (
                <option value="">
                  {this.state.newServer || this.state.needsTest
                    ? "Please test connection"
                    : "Loading..."}
                </option>
              )}
            </select>
          </div>
          <label>Language</label>
          <div
            className={`styled-input--select ${this.state.languages ? "" : "disabled"
              }`}
          >
            <select
              name="language"
              value={this.state.language.id}
              onChange={this.inputChange}
            >
              {this.state.languages && !this.state.needsTest ? (
                <>
                  <option value="">Choose an option</option>
                  {this.state.languages.map((item) => {
                    return (
                      <option key={`pp__${item.id}`} value={item.id}>
                        {item.name}
                      </option>
                    );
                  })}
                </>
              ) : (
                <option value="">
                  {this.state.newServer || this.state.needsTest
                    ? "Please test connection"
                    : "Loading..."}
                </option>
              )}
            </select>
          </div>
          {!this.state.newServer &&
            this.state.path.id != null &&
            this.state.profile.id != null &&
            !this.state.needsTest ? (
            <div className="checkbox-wrap mb--2">
              <input
                type="checkbox"
                name="enabled"
                checked={this.state.enabled}
                onChange={this.inputChange}
              />
              <p>Enabled</p>
            </div>
          ) : null}
        </Modal>

        <section>
          <p className="main-title mb--2">Radarr</p>
          <p className="description">
            Radarr is a DVR. It can monitor multiple RSS feeds for new movies
            and will grab, sort, and rename them.
          </p>
        </section>
        <section>
          <p className="main-title mb--2">Servers</p>
          <div className="sr--grid">
            {this.state.servers.map((server, i) => {
              serverCount++;
              console.log(JSON.stringify(server, null, 4));
              return (
                <div key={server.uuid} className="sr--instance">
                  <div className="sr--instance--inner">
                    <ServerIcon />
                    <p className="sr--title">{server.title}</p>
                    <p>{`${server.protocol}://${server.host}:${server.port}`}</p>
                    <p>Status: {server.enabled ? "Enabled" : "Disabled"}</p>
                    <p>
                      Profile:{" "}
                      {server.profile.name ?? "Not set"}
                    </p>
                    <p>
                      Path: {server.path.location ?? "Not set"}
                    </p>
                    <p>
                      Language: {server.language.name ?? "Not set"}
                    </p>
                    <p className="small">
                      ID: {server.uuid ? server.uuid : "Error"}
                    </p>
                    <div className="btn-wrap">
                      <button
                        className="btn btn__square"
                        onClick={() => {
                          this.openModal("addServer");
                          this.openWizard(i);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn__square"
                        onClick={() => this.test(server.uuid)}
                      >
                        Test
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="sr--instance sr--add-new">
              <div
                className="sr--instance--inner"
                onClick={() => {
                  this.openModal("addServer");
                  this.openWizard(serverCount);
                }}
              >
                <p className="sr--title">Add new</p>
                <Add />
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }
}

export default Radarr;
