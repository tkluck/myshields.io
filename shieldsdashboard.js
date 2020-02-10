const shieldsRegexes = [
  /https:\/\/travis-ci.org\/[^\s]*\.svg(?:\?[^\s]*)?/g,
  /https:\/\/ci.appveyor.com\/api\/projects\/status\/\w+\?svg=true/g,
  /https:\/\/coveralls.io\/[^\s]*\/badge.svg(?:\?[^\s]^)?/g,
  /https:\/\/img.shields.io\/circleci\/project\/github\/[^\s]*\.svg/g,
  /https:\/\/codecov.io\/gh\/[^\s]*\/badge\.svg/g
]

Vue.component('repo-row', {
  props: ['repo'],
  data: function() {
    return {
      readme: "",
      errorstate: ""
    }
  },
  created: function() {
    let vuecomp = this
    axios.get(
      `https://raw.githubusercontent.com/${this.repo.full_name}/${this.repo.default_branch}/README.md`,
      { responseType: 'text' })
      .then(function(response) {
        vuecomp.errorstate = ""
        vuecomp.readme = response.data
      })
      .catch(function(error) {
        vuecomp.errorstate = "Could not reach github: " + error
      })
  },
  computed: {
    shields: function() {
      return _.flatten(_.map(shieldsRegexes, re => this.readme.match(re)))
    }
  },
  template: `
    <tr v-if="!_.isEmpty(shields)">
      <td><a v-bind:href="repo.html_url">{{repo.name}}</a></td>
      <td>
        <img v-for="shield in shields" v-bind:src="shield"/>
      </td>
    </tr>
  `
})

var app = new Vue({
  el: '#app',
  data: {
    errorstate: "",
    repositories: [],
    anchor: window.location.hash.slice(1),
  },
  computed: {
    query: {
      get: function() {
        let p = new URLSearchParams(this.anchor)
        return p.get('q')
      },
      set: function(val) {
        let p = new URLSearchParams(this.anchor)
        p.set('q', val)
        this.anchor = p.toString()
      }
    }
  },
  created: function() {
    if(!this.query) {
      this.query = "user:tkluck"
    } else {
      // already a side-effect of the assignment in the other branch
      this.updateRepos()
    }
  },
  methods: {
    updateRepos: function() {
      let vueapp = this
      axios.get(
        "https://api.github.com/search/repositories",
        {
          params: { q: this.query }
        })
        .then(function(response) {
          vueapp.errorstate = ""
          // TODO: act on response.data.incomplete_results
          vueapp.repositories = response.data.items
        })
        .catch(function(error) {
          vueapp.errorstate = "Could not reach github: " + error
        })
    }
  },
  watch: {
    query: function() {
      this.updateRepos()
    },
    anchor: function() {
      window.location.hash = '#' + this.anchor
    }
  }
})
