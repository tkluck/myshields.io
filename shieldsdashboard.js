const shieldsRegexes = [
  /https:\/\/travis-ci.org\/[^\s]*?\.svg(?:\?[^\s]*?)?/g,
  /https:\/\/ci.appveyor.com\/api\/projects\/status\/\w+\?svg=true/g,
  /https:\/\/coveralls.io\/[^\s]*?\/badge.svg(?:\?[^\s]^)?/g,
  /https:\/\/img.shields.io\/circleci\/project\/github\/[^\s]*?\.svg/g,
  /https:\/\/codecov.io\/gh\/[^\s]*?\/badge\.svg/g,
  /https:\/\/github.com\/[^\s]*?\/workflows\/CI\/badge\.svg/g
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
    pkgname: function() {
      if(this.repo.name.slice(-3) === ".jl") {
        return this.repo.name.slice(0,-3)
      } else {
        return undefined
      }
    },
    shields: function() {
      let shields = [
        `https://img.shields.io/github/stars/${this.repo.full_name}.svg`,
      ];
      if(this.pkgname) {
        shields.push(
          `https://juliaci.github.io/NanosoldierReports/pkgeval_badges/${this.pkgname[0]}/${this.pkgname}.svg`
        );
      }
      let capturedshields = _.filter(_.flatten(_.map(shieldsRegexes, re => this.readme.match(re))));
      shields = _.concat(shields, capturedshields);

      if(this.repo.open_issues_count > 0) {
        shields.push(
          `https://img.shields.io/github/issues-raw/${this.repo.full_name}.svg`
        );
      }

      return shields;
    },
  },
  template: `
    <a class="list-group-item list-group-item-action" v-if="!_.isEmpty(shields)" v-bind:href="repo.html_url">
      <div class="row">
        <div class="col-3">
          <h5 class="mb-1">{{repo.name}}</h5>
        </div>
        <div class="col-9">
          <img v-for="shield in shields" v-bind:src="shield" style="margin-left:0.5em; margin-right:0.5em"/>
        </div>
      </div>
    </a>
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
    onhashchange = this.updateAnchor
    if(!this.query) {
      this.query = "user:tkluck archived:false"
    } else {
      // already a side-effect of the assignment in the other branch
      this.updateRepos()
    }
  },
  methods: {
    updateAnchor: function() {
      this.anchor = window.location.hash.slice(1)
    },
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
