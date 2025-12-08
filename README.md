This a NodeJS based app server for a BIY (build-it-yourself) architecture app idea.

It suports a minimal UI intended to help users plan their bugdet based on preferences. Here is how it works:

- The template handler returns the costing structure by parsing a CSV (has to be moved to mongo DB, soon!)
- The user uses the structure to pick their ideal choices. However, this is only aspirational and user cannot be expected to get it right.
- So next, we collect these 'ideal choices' and user's target budget, interpet a priority out of it and run our optimiser to return the best choices.
