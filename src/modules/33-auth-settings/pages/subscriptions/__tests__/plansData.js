/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const plansData = {
  data: {
    pricing: {
      id: '1',
      published_at: '2021-08-08T06:05:23.927Z',
      created_at: '2021-06-24T02:59:20.911Z',
      updated_at: '2021-09-01T19:09:56.598Z',
      hero: {
        title: 'Flexible Pricing for Every Team',
        desc: null,
        subTitle: 'Sign up now, upgrade anytime. ',
        __typename: 'ComponentPageMiniTitleZone'
      },
      ciPlans: [
        {
          title: 'Community',
          desc: 'Powered by Open Source Community - Fast, Reliable & Efficient CI ',
          img: {
            url: '/uploads/icon_community_016e123cb8.svg',
            width: 64,
            height: 64,
            __typename: 'UploadFile'
          },
          price: '$0',
          yearlyPrice: '$0',
          unit: '',
          unitTips: null,
          link: 'https://docs.drone.io/server/overview/',
          featureListZone: [
            {
              id: '796',
              title: 'Unlimited Developers',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1082',
              title: 'Unlimited Builds',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '797',
              title: 'Git Experience (Pipeline as Code)',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1019',
              title: 'REST API & Webhook executions',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1020',
              title: 'Pipeline Plugins support',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1021',
              title: 'Data Storage - Sqlite',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Download',
          primaryButton: false,
          comingSoon: null,
          priceTips: 'Open Source',
          yearlyPriceTips: null,
          priceTerm: null,
          priceTermTips: null,
          yearlyPriceTerm: null,
          yearlyPriceTermTips: null,
          support: 'Support - Community',
          featureTitle: null,
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        },
        {
          title: 'Team',
          desc: 'Simplicity, Reliability & Flexibility  for Growing Businesses',
          img: {
            url: '/uploads/feature_lib_8e0c6717d2.svg',
            width: 62,
            height: 70,
            __typename: 'UploadFile'
          },
          price: '$30',
          yearlyPrice: '$25',
          unit: 'per Developer',
          unitTips: '"Developer" refers to any Git user leveraging Harness CI.',
          link: 'https://www.drone.io/enterprise/',
          featureListZone: [
            {
              id: '815',
              title: 'Unlimited Developers',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1083',
              title: 'Unlimited Builds',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1027',
              title: 'Auto Scaling (Clustering)',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1028',
              title: 'Monorepo support',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1029',
              title: 'External Approvals & Secret Managers',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1030',
              title: 'Pipeline Scheduling',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1031',
              title: 'Template support',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Try Now',
          primaryButton: false,
          comingSoon: null,
          priceTips: 'Available as Self-Hosted',
          yearlyPriceTips: null,
          priceTerm: null,
          priceTermTips: null,
          yearlyPriceTerm: null,
          yearlyPriceTermTips: null,
          support: 'Support - Standard\n(Premier Support Add-On available)',
          featureTitle: 'Community Plan plus:',
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        },
        {
          title: 'Enterprise',
          desc: 'Scalability, Governance & Intelligence for Best in Class Enterprise Teams',
          img: {
            url: '/uploads/feature_security_ee17443b21.svg',
            width: 72,
            height: 74,
            __typename: 'UploadFile'
          },
          price: '$60',
          yearlyPrice: '$50',
          unit: 'per Developer',
          unitTips: '"Developer" refers to an Active Code Committer.',
          link: 'https://app.harness.io/auth/#/signup/?module=ci',
          featureListZone: [
            {
              id: '806',
              title: 'Unlimited Developers',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1084',
              title: 'Unlimited Builds',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1022',
              title: 'Integrated Platform with CD, FF & CCM modules',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1023',
              title: 'Test Intelligence (ML based test-cycle optimization)',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1024',
              title: 'Advanced Security & Governance',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1025',
              title: 'Organize by Multiple Projects & Organizations',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1026',
              title: 'Template Library (Coming Soon)',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Try Now',
          primaryButton: true,
          comingSoon: null,
          priceTips: 'Available as Self-Hosted',
          yearlyPriceTips: null,
          priceTerm: null,
          priceTermTips: null,
          yearlyPriceTerm: null,
          yearlyPriceTermTips: null,
          support: 'Support - Standard\n(Premier Support Add-On available)',
          featureTitle: 'Team Plan plus:',
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        }
      ],
      ciSaasPlans: [
        {
          title: 'Free',
          desc: 'Fully-managed Service to help you get started - Perfect for Small Teams',
          img: {
            url: '/uploads/feature_pipeline_46ed6ac2fe.svg',
            width: 58,
            height: 49,
            __typename: 'UploadFile'
          },
          price: '$0',
          yearlyPrice: '$0',
          unit: '',
          unitTips: '',
          link: '',
          featureListZone: [
            {
              id: '916',
              title: 'Limited to 2500 Builds (then 100 Builds per month)',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1059',
              title: 'Integrated Platform with CD, FF & CCM modules',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1060',
              title: 'Build Health & Execution Dashboards',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1061',
              title: 'Git Experience (Pipeline as code) & REST APIs',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Coming Soon',
          primaryButton: false,
          comingSoon: true,
          priceTips: 'Available as SaaS',
          priceTerm: null,
          priceTermTips: null,
          yearlyPriceTerm: null,
          yearlyPriceTermTips: null,
          support: 'Support - Community',
          featureTitle: null,
          callOut: {
            title: 'Harness loves Open Source',
            desc: 'We love Open Source and are committed to supporting ourCommunity! [Contact Us](/company/contact-us), and we will be happy to provide you with a no restriction Free Plan!',
            __typename: 'ComponentPricingPageCallOut'
          },
          __typename: 'ComponentPricingPagePlansZone'
        },
        {
          title: 'Team',
          desc: 'Simplicity, Reliability & Flexibility for Growing Businesses',
          img: {
            url: '/uploads/feature_lib_8e0c6717d2.svg',
            width: 62,
            height: 70,
            __typename: 'UploadFile'
          },
          price: '$30',
          yearlyPrice: '$25',
          unit: 'per Developer',
          unitTips: '"Developer" refers to an Active Code Committer.',
          link: '',
          featureListZone: [
            {
              id: '918',
              title: 'Up to 300 Developers',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1090',
              title: 'Unlimited Builds',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1063',
              title: 'External & Custom Secret Managers',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1064',
              title: 'External & Custom Approval Workflows',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1065',
              title: 'SLA Guarantee',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Coming Soon',
          primaryButton: false,
          comingSoon: true,
          priceTips: 'Available as SaaS',
          priceTerm: null,
          priceTermTips: null,
          yearlyPriceTerm: null,
          yearlyPriceTermTips: null,
          support: 'Support - Standard\n(Premier Support Add-On available)',
          featureTitle: 'Free Plan plus:',
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        },
        {
          title: 'Enterprise',
          desc: 'Scalability, Governance & Intelligence for Best in Class Enterprise Teams',
          img: {
            url: '/uploads/feature_security_ee17443b21.svg',
            width: 72,
            height: 74,
            __typename: 'UploadFile'
          },
          price: '$60',
          yearlyPrice: '$50',
          unit: 'per Developer',
          unitTips: '"Developer" refers to an Active Code Committer.',
          link: 'https://app.harness.io/auth/#/signup/?module=ci',
          featureListZone: [
            {
              id: '920',
              title: 'Unlimited Developers',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1091',
              title: 'Unlimited Builds',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1066',
              title: 'Test Intelligence (ML based test-cycle optimization)',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1067',
              title: 'Advanced Security & Governance',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1068',
              title: 'Organize by Multiple Organizations',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1069',
              title: 'Template Library (Coming Soon)',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Try Now',
          primaryButton: true,
          comingSoon: null,
          priceTips: 'Available as SaaS',
          priceTerm: null,
          priceTermTips: null,
          yearlyPriceTerm: null,
          yearlyPriceTermTips: null,
          support: 'Support - Standard\n(Premier Support Add-On available)',
          featureTitle: 'Team Plan plus:',
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        }
      ],
      cdPlans: [
        {
          title: 'Free',
          desc: 'Fully-managed Service to Help You Get Started - Perfect for Small Teams',
          img: {
            url: '/uploads/feature_pipeline_46ed6ac2fe.svg',
            width: 58,
            height: 49,
            __typename: 'UploadFile'
          },
          price: '$0',
          yearlyPrice: '$0',
          unit: null,
          unitTips: null,
          link: null,
          featureListZone: [
            {
              id: '196',
              title: 'Limited to 5 Services & 10 Deployments per Day',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '197',
              title: 'Integrated Platform with CI, FF & CCM modules',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '198',
              title: 'Deploy on all key clouds and platforms',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '199',
              title: 'Continuous Verification (with Advanced Deployment Strategies & Rollback)',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '200',
              title: 'Git Experience (Pipeline as code) & REST APIs',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '927',
              title: 'Integrated Infrastructure Provisioning',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Coming Soon',
          primaryButton: false,
          comingSoon: true,
          priceTips: 'Available as SaaS',
          yearlyPriceTips: 'Available as SaaS',
          support: 'Support - Community',
          featureTitle: null,
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        },
        {
          title: 'Team',
          desc: 'Simplicity, Reliability & Flexibility  for Growing Businesses',
          img: {
            url: '/uploads/feature_lib_8e0c6717d2.svg',
            width: 62,
            height: 70,
            __typename: 'UploadFile'
          },
          price: '$120',
          yearlyPrice: '$100',
          unit: 'per Service',
          unitTips:
            '"Service" refers to a form of workload that can be deployed by Harness CD, such as a Microservice on Kubernetes Clusters, Serverless Function on AWS Lambda, JAVA process on a Virtual Machine, etc.',
          link: '',
          featureListZone: [
            {
              id: '1070',
              title: 'Up to 100 Services',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '820',
              title: 'Unlimited Users',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1071',
              title: 'Unlimited Deployments per Day',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '822',
              title: 'External & Custom Secret Managers',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '823',
              title: 'External & Custom Approval Workflows',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '824',
              title: 'SLA Guarantee',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Coming Soon',
          primaryButton: false,
          comingSoon: true,
          priceTips: 'Available as SaaS',
          yearlyPriceTips: 'Available as SaaS',
          support: 'Support - Standard\n(Premier Support Add-On available)',
          featureTitle: 'Free Plan plus:',
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        },
        {
          title: 'Enterprise',
          desc: 'Scalability, Security  & Governance for Best in Class Enterprise Teams',
          img: {
            url: '/uploads/feature_security_ee17443b21.svg',
            width: 72,
            height: 74,
            __typename: 'UploadFile'
          },
          price: 'Custom Pricing',
          yearlyPrice: 'Custom Pricing',
          unit: 'per Service',
          unitTips:
            '"Service" refers to a form of workload that can be deployed by Harness CD, such as a Microservice on Kubernetes Clusters, Serverless Function on AWS Lambda, JAVA process on a Virtual Machine, etc.',
          link: 'https://app.harness.io/auth/#/signup/?module=cd',
          featureListZone: [
            {
              id: '1072',
              title: 'Unlimited Services',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '825',
              title: 'Unlimited Users',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1073',
              title: 'Unlimited Deployments per Day',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '826',
              title: 'Advanced Security & Governance',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '827',
              title: 'Organize by Multiple Organizations',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '828',
              title: 'Template Library',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '829',
              title: 'Custom Dashboards',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Try Now',
          primaryButton: true,
          comingSoon: null,
          priceTips: 'Available as SaaS & Self-Hosted',
          yearlyPriceTips: 'Available as SaaS & Self-Hosted',
          support: 'Support - Standard\n(Premier Support Add-On available)',
          featureTitle: 'Team Plan plus:',
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        }
      ],
      ccPlans: [
        {
          title: 'Free',
          desc: 'Fully managed Service to help you get started - Perfect for Small Teams',
          img: {
            url: '/uploads/feature_pipeline_46ed6ac2fe.svg',
            width: 58,
            height: 49,
            __typename: 'UploadFile'
          },
          price: '$0',
          yearlyPrice: '$0',
          unit: null,
          unitTips: null,
          link: null,
          featureListZone: [
            {
              id: '858',
              title: 'Limited to $250K of Cloud Spend optimization',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1046',
              title: 'Integrated Platform with CD, CI & FF modules',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1047',
              title: 'Built-in Cloud Cost BI Dashboards',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1048',
              title: 'Cost Optimization with Intelligent Cloud Auto Stopping',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1049',
              title: 'Cost Budgets, Anomalies & Recommendations',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Coming Soon',
          primaryButton: false,
          comingSoon: true,
          priceTips: 'Available as SaaS',
          yearlyPriceTips: 'Available as SaaS',
          priceTerm: null,
          priceTermTips: null,
          yearlyPriceTerm: null,
          yearlyPriceTermTips: null,
          support: 'Support - Community',
          featureTitle: null,
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        },
        {
          title: 'Team',
          desc: 'Simplicity, Reliability & Flexibility  for Growing Businesses',
          img: {
            url: '/uploads/feature_lib_8e0c6717d2.svg',
            width: 62,
            height: 70,
            __typename: 'UploadFile'
          },
          price: '2.75%',
          yearlyPrice: '2.25%',
          unit: '',
          unitTips: '',
          link: '',
          featureListZone: [
            {
              id: '863',
              title: 'Unlimited Cloud Spend',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1050',
              title: 'Unlimited Clusters under monitoring',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1051',
              title: 'Unlimited Cost Perspectives',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1052',
              title: 'Custom Cloud Cost BI Dashboards & Comprehensive cost visibility',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1053',
              title: 'Data Retention - 5 Years',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1054',
              title: 'SLA Guarantee',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Coming Soon',
          primaryButton: false,
          comingSoon: true,
          priceTips: 'of Monthly Cloud Spend',
          yearlyPriceTips: 'of Annual Cloud Spend',
          priceTerm: 'Cloud Spend',
          priceTermTips:
            '"Cloud Spend" refers to the total spend (dollars) managed and optimized by Harness Cloud Cost Management.',
          yearlyPriceTerm: 'Cloud Spend',
          yearlyPriceTermTips:
            '"Cloud Spend" refers to the total spend (dollars) managed and optimized by Harness Cloud Cost Management.',
          support: 'Support - Standard\n(Premier Support Add-On available)',
          featureTitle: 'Free Plan plus:',
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        },
        {
          title: 'Enterprise',
          desc: 'Scalability, Security  & Governance for Best in Class Enterprise Teams ',
          img: {
            url: '/uploads/feature_security_ee17443b21.svg',
            width: 72,
            height: 74,
            __typename: 'UploadFile'
          },
          price: '3.00%',
          yearlyPrice: '2.50%',
          unit: '',
          unitTips: '',
          link: 'https://app.harness.io/auth/#/signup/?module=ce',
          featureListZone: [
            {
              id: '1087',
              title: 'Unlimited Cloud Spend',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1088',
              title: 'Unlimited Clusters under monitoring',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1089',
              title: 'Unlimited Cost Perspectives',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '868',
              title: 'Advanced Security',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1055',
              title: 'Advanced Governance',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1056',
              title: 'Organize by Multiple Organizations',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1057',
              title: 'Granular & Customizable Role based Access',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1058',
              title: 'LDAP support',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Try Now',
          primaryButton: true,
          comingSoon: null,
          priceTips: 'of Monthly Cloud Spend',
          yearlyPriceTips: 'of Annual Cloud Spend',
          priceTerm: 'Cloud Spend',
          priceTermTips:
            '"Cloud Spend" refers to the total spend (dollars) managed and optimized by Harness Cloud Cost Management.',
          yearlyPriceTerm: 'Cloud Spend',
          yearlyPriceTermTips:
            '"Cloud Spend" refers to the total spend (dollars) managed and optimized by Harness Cloud Cost Management.',
          support: 'Support - Standard\n(Premier Support Add-On available)',
          featureTitle: 'Team Plan plus:',
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        }
      ],
      ffPlans: [
        {
          title: 'Free',
          desc: 'Fully managed Service to help you get started - Perfect for Small Teams',
          img: {
            url: '/uploads/feature_pipeline_46ed6ac2fe.svg',
            width: 58,
            height: 49,
            __typename: 'UploadFile'
          },
          price: '$0',
          yearlyPrice: '$0',
          unit: null,
          unitTips: null,
          link: null,
          featureListZone: [
            {
              id: '834',
              title: 'Limited to 2 Developers, 25K MAUs & Unlimited Server Monthly Active Users',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1032',
              title: 'Integrated Platform with CD, CI & CCM modules',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1033',
              title: 'Unlimited Flags, Environments & Targets',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1034',
              title: 'Git Experience (Flags as code) & REST APIs',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1036',
              title: 'Progressive Delivery',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1035',
              title: 'Feature flag pipelines (coming soon)',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Coming Soon',
          primaryButton: false,
          comingSoon: true,
          priceTips: 'Available as SaaS',
          yearlyPriceTips: 'Available as SaaS',
          priceTerm: null,
          priceTermTips: null,
          yearlyPriceTerm: null,
          yearlyPriceTermTips: null,
          support: 'Support - Community',
          featureTitle: null,
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        },
        {
          title: 'Team',
          desc: 'Simplicity, Reliability & Flexibility  for Growing Businesses',
          img: {
            url: '/uploads/feature_lib_8e0c6717d2.svg',
            width: 62,
            height: 70,
            __typename: 'UploadFile'
          },
          price: '$18',
          yearlyPrice: '$15',
          unit: 'per Developer',
          unitTips:
            '"Developer" refers to an active Feature Flag module user engaged in create/edit/delete of Feature Flags and or Targets/Segments.',
          link: '',
          featureListZone: [
            {
              id: '839',
              title: 'Up to 50 Developers',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1037',
              title: 'Up to 1 Million MAUs',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1038',
              title: '25K MAUs included',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1085',
              title: 'Unlimited Server Monthly Active Users',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1040',
              title: 'SLA Guarantee',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Coming Soon',
          primaryButton: false,
          comingSoon: true,
          priceTips: '25K MAUs included Free + Add-on $90 per 25K MAU',
          yearlyPriceTips: '25K MAUs included Free + Add-on $75 per 25K MAU',
          priceTerm: 'MAUs',
          priceTermTips:
            'MAUs or Monthly Active Users refers to all active end user (over a 30-day period) of the business application integrated (via Client SDKs) with Feature Flags for controlled rollouts.',
          yearlyPriceTerm: 'MAUs',
          yearlyPriceTermTips:
            'MAUs or Monthly Active Users refers to all active end user (over a 30-day period) of the business application integrated (via Client SDKs) with Feature Flags for controlled rollouts.',
          support: 'Support - Standard\n(Premier Support Add-On available)',
          featureTitle: 'Free Plan plus:',
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        },
        {
          title: 'Enterprise',
          desc: 'Scalability, Security  & Governance for Best in Class Enterprise Teams ',
          img: {
            url: '/uploads/feature_security_ee17443b21.svg',
            width: 72,
            height: 74,
            __typename: 'UploadFile'
          },
          price: '$30',
          yearlyPrice: '$25',
          unit: 'per Developer',
          unitTips:
            '"Developer" refers to an active Feature Flag module user engaged in create/edit/delete of Feature Flags and or Targets/Segments.',
          link: 'https://app.harness.io/auth/#/signup/?module=cf',
          featureListZone: [
            {
              id: '844',
              title: 'Unlimited Developers',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1041',
              title: 'Unlimited MAUs',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1042',
              title: '25K MAUs included',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1086',
              title: 'Unlimited Server Monthly Active Users',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1043',
              title: 'Automatic progressive delivery  (Coming Soon)',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1044',
              title: 'Analytics & Custom Dashboards (Coming Soon)',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '1045',
              title: 'Experimentation & Monitoring (Coming Soon)',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Try Now',
          primaryButton: true,
          comingSoon: null,
          priceTips: '25K MAUs included Free + Add-on $120 per 25K MAU',
          yearlyPriceTips: '25K MAUs included Free + Add-on $100 per 25K MAU',
          priceTerm: 'MAUs',
          priceTermTips:
            'MAUs or Monthly Active Users refers to all active end user (over a 30-day period) of the business application integrated (via Client SDKs) with Feature Flags for controlled rollouts.',
          yearlyPriceTerm: 'MAUs',
          yearlyPriceTermTips:
            'MAUs or Monthly Active Users refers to all active end user (over a 30-day period) of the business application integrated (via Client SDKs) with Feature Flags for controlled rollouts.',
          support: 'Support - Standard\n(Premier Support Add-On available)',
          featureTitle: 'Team Plan plus:',
          callOut: {
            title: null,
            desc: null,
            __typename: 'ComponentPricingPageCallOut'
          },
          __typename: 'ComponentPricingPagePlansZone'
        }
      ],
      chIntelPlans: [
        {
          title: 'Ch Community',
          desc: 'Cloud-native for easy, repeatable CI/CD',
          img: {
            url: '/uploads/icon_community_016e123cb8.svg',
            width: 64,
            height: 64,
            __typename: 'UploadFile'
          },
          price: '$0',
          yearlyPrice: '$0',
          unit: 'month',
          unitTips: null,
          link: null,
          featureListZone: [
            {
              id: '901',
              title: 'On-premises only ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '902',
              title: 'Kubernetes, VMs, Serverless, Custom ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '903',
              title: 'Deployment verification ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '904',
              title: '5 workloads ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '905',
              title: '10 deployments/day',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Download',
          primaryButton: false,
          comingSoon: null,
          priceTips: null,
          yearlyPriceTips: null,
          priceTerm: null,
          priceTermTips: null,
          yearlyPriceTerm: null,
          yearlyPriceTermTips: null,
          support: 'Support - Community',
          featureTitle: null,
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        },
        {
          title: 'Free',
          desc: 'Fully-featured CD for small startups and groups of developers',
          img: {
            url: '/uploads/feature_pipeline_46ed6ac2fe.svg',
            width: 58,
            height: 49,
            __typename: 'UploadFile'
          },
          price: '$0',
          yearlyPrice: '$0',
          unit: null,
          unitTips: null,
          link: null,
          featureListZone: [
            {
              id: '882',
              title: 'SaaS only ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '883',
              title: 'Kubernetes, VMs, Serverless, Custom ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '884',
              title: 'Deployment verification ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '885',
              title: '5 workloads ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '886',
              title: '10 deployments/day',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Create A Free Account',
          primaryButton: false,
          comingSoon: true,
          priceTips: 'Free forever',
          yearlyPriceTips: null,
          priceTerm: null,
          priceTermTips: null,
          yearlyPriceTerm: null,
          yearlyPriceTermTips: null,
          support: 'Support - Community',
          featureTitle: null,
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        },
        {
          title: 'Team',
          desc: 'Best-in-class CD, optimized for growing companies',
          img: {
            url: '/uploads/feature_lib_8e0c6717d2.svg',
            width: 62,
            height: 70,
            __typename: 'UploadFile'
          },
          price: '$99',
          yearlyPrice: '$299',
          unit: null,
          unitTips: null,
          link: null,
          featureListZone: [
            {
              id: '887',
              title: 'SaaS only ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '888',
              title: 'Kubernetes, VMs, Serverless, Templates ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '889',
              title: 'Deployment verification ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '890',
              title: '100 workloads max ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '891',
              title: 'Unlimited deployments',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Try for free',
          primaryButton: true,
          comingSoon: null,
          priceTips: '25K MAUs included Free, Add-on $90 per 25K MAUs',
          yearlyPriceTips: null,
          priceTerm: null,
          priceTermTips: null,
          yearlyPriceTerm: null,
          yearlyPriceTermTips: null,
          support: 'Support - Standard Helpdesk\n(Premier Support Add-On available)',
          featureTitle: 'Free Plan plus:',
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        },
        {
          title: 'Enterprise',
          desc: 'Enterprise-scale CD, built for world’s most demanding businesses',
          img: {
            url: '/uploads/feature_security_ee17443b21.svg',
            width: 72,
            height: 74,
            __typename: 'UploadFile'
          },
          price: '$175',
          yearlyPrice: '$375',
          unit: null,
          unitTips: null,
          link: null,
          featureListZone: [
            {
              id: '892',
              title: 'SaaS + On-premises ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '893',
              title: 'Kubernetes, VMs, Serverless, Templates ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '894',
              title: 'Deployment verification ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '895',
              title: 'Unlimited workloads ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '896',
              title: 'Unlimited deployments ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '897',
              title: 'Enterprise security ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '898',
              title: 'Enterprise governance ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '899',
              title: 'Custom dashboards ',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            },
            {
              id: '900',
              title: 'And more',
              link: null,
              __typename: 'ComponentPageFeatureLIstZone'
            }
          ],
          buttonText: 'Try for free',
          primaryButton: false,
          comingSoon: null,
          priceTips: '25K MAUs included Free, Add-on $90 per 25K MAUs',
          yearlyPriceTips: null,
          priceTerm: null,
          priceTermTips: null,
          yearlyPriceTerm: null,
          yearlyPriceTermTips: null,
          support: 'Support - Standard Helpdesk\n(Premier Support Add-On available)',
          featureTitle: 'Team Plan plus:',
          callOut: null,
          __typename: 'ComponentPricingPagePlansZone'
        }
      ],
      ciFeatureCaption: [
        {
          title: 'Community',
          btnText: 'Download',
          btnLink: 'https://github.com/drone/drone',
          primaryButton: true,
          __typename: 'ComponentPricingPageFeatureCaption'
        },
        {
          title: 'Team',
          btnText: 'Try Now',
          btnLink: 'https://www.drone.io/enterprise/',
          primaryButton: false,
          __typename: 'ComponentPricingPageFeatureCaption'
        },
        {
          title: 'Enterprise',
          btnText: 'Try Now',
          btnLink: 'https://app.harness.io/auth/#/signup/?module=ci',
          primaryButton: false,
          __typename: 'ComponentPricingPageFeatureCaption'
        }
      ],
      ciFeatureGroup: [
        {
          title: 'Pricing',
          detailedFeature: [
            {
              title: 'Annual Subscription',
              link: null,
              communityValue: null,
              communityText: '$0',
              freeValue: null,
              freeText: '',
              teamValue: null,
              teamText: '$25 per Developer per month',
              enterpriseValue: null,
              enterpriseText: '$50 per Developer per month',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Monthly Subscription',
              link: null,
              communityValue: null,
              communityText: '$0',
              freeValue: null,
              freeText: null,
              teamValue: null,
              teamText: '$30 per Developer per month',
              enterpriseValue: null,
              enterpriseText: '$60 per Developer per month',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: '  Developers',
              link: null,
              communityValue: null,
              communityText: 'Unlimited',
              freeValue: null,
              freeText: '',
              teamValue: null,
              teamText: 'Buy as many as needed',
              enterpriseValue: null,
              enterpriseText: 'Buy as many as needed',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Builds per Month',
              link: null,
              communityValue: null,
              communityText: 'Unlimited',
              freeValue: null,
              freeText: null,
              teamValue: null,
              teamText: 'Unlimited',
              enterpriseValue: null,
              enterpriseText: 'Unlimited',
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'CI Pipeline Capabilities',
          detailedFeature: [
            {
              title: 'Pipelines as Code/Git Experience',
              link: 'https://docs.harness.io/article/khbt0yhctx-harness-git-ops',
              communityValue: 'Yes',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Visual Pipeline Editor with built-in YAML editor',
              link: null,
              communityValue: 'Yes',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Pipeline Parametrization',
              link: 'https://docs.harness.io/article/60j7391eyy-templatize-pipelines',
              communityValue: 'Yes',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Smart Pipeline Triggers (with customizable webhook based execution)',
              link: 'https://docs.harness.io/article/xerirloz9a-add-a-trigger-2',
              communityValue: 'Yes',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Advanced Conditional Execution (built for debuggability)',
              link: null,
              communityValue: 'Yes',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Pipeline Notifications',
              link: 'https://docs.harness.io/article/kf828e347t-notification-groups',
              communityValue: 'Yes',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Service Dependencies',
              link: null,
              communityValue: 'Yes',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Failure Strategies ',
              link: null,
              communityValue: 'Yes',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Monorepo support',
              link: null,
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Pipeling Scheduling',
              link: 'https://docs.harness.io/article/tb66fmh4iz-trigger-a-deployment-on-a-time-schedule',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Unified Pipeline with Harness CD',
              link: null,
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Tests Intelligence (ML based test cycle optimization - for speed & accuracy)',
              link: null,
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Test Results Visualization & Analytics',
              link: null,
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Build Artifact Summaries',
              link: null,
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Matrix build stages (coming soon)',
              link: null,
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Integrations',
          detailedFeature: [
            {
              title: 'SCM support (GitHub, BitBucket, GitLab, CodeCommit, generic)',
              link: null,
              communityValue: 'Yes',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Plugins Support',
              link: null,
              communityValue: 'Yes',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'GitHub App support',
              link: null,
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Approvals with (built-in) Harness UI',
              link: 'https://docs.harness.io/article/0ajz35u2hy-approvals',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with (built-in) Harness Secrets Manager',
              link: 'https://docs.harness.io/article/avo98eldl0-add-a-google-cloud-kms-secrets-manager',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Approvals with Jira',
              link: 'https://docs.harness.io/article/qxki6o7y31-jira-based-approvals',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Approvals with ServiceNow',
              link: 'https://docs.harness.io/article/9nkuhm8moo-service-now-ticketing-system',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Approvals with Slack',
              link: 'https://docs.harness.io/article/mtr398a9cl-slack-approvals',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Approvals with Custom Shell Scripts',
              link: 'https://docs.harness.io/article/lf79ixw2ge-shell-script-ticketing-system',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with HashiCorp Vault Secrets Manager',
              link: 'https://docs.harness.io/article/am3dmoxywy-add-a-hashi-corp-vault-secrets-manager',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with CyberArk Secrets Manager',
              link: 'https://docs.harness.io/article/uzsv1l2ivd-add-a-cyber-ark-secrets-manager',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with AWS KMS Secrets Manager',
              link: 'https://docs.harness.io/article/qj4psb5vsf-add-an-aws-kms-secrets-manager',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with AWS Secrets Manager',
              link: 'https://docs.harness.io/article/otkxijqoa6-add-an-aws-secrets-manager',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with Azure Key Vault Secrets Manager',
              link: 'https://docs.harness.io/article/2nv0gy1wnh-azure-key-vault',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with Google Cloud Secrets Manager',
              link: 'https://docs.harness.io/article/t0rj3ze6ui-add-a-google-cloud-secrets-manager',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with Custom Secrets Manager',
              link: 'https://docs.harness.io/article/ejaddm3ddb-add-and-use-a-custom-secrets-manager',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Administration',
          detailedFeature: [
            {
              title: 'REST APIs',
              link: 'https://docs.harness.io/category/l2p3i03l4a-api',
              communityValue: 'Yes',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Auto Scaling',
              link: null,
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Templates Library (coming soon)',
              link: 'https://docs.harness.io/article/dv7ajeroou-account-and-application-templates#shared_template_library_and_application_template_library',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Multiple Projects',
              link: null,
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Multiple Organizations',
              link: null,
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Build Health & Execution Dashboard (Project Overview)',
              link: null,
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Custom Dashboarding',
              link: 'https://docs.harness.io/article/rxlbhvwe6q-custom-dashboards',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Built-in User Management & Authentication',
              link: 'https://docs.harness.io/article/zlymcu6bf1-authentication-settings',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Single Sign-On (SSO) with OAuth 2.0',
              link: 'https://docs.harness.io/article/02ehq56x6d-single-sign-on-sso-with-oauth-2-0',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Single Sign-On (SSO) with SAML',
              link: 'https://docs.harness.io/article/zy8yjcrqzg-single-sign-on-sso-with-saml',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Single Sign-On (SSO) with LDAP',
              link: 'https://docs.harness.io/article/85rycqfiqg-sso-ldap',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Provisioning Users with Okta (SCIM)',
              link: 'https://docs.harness.io/article/8hwnfif0v1-scim-okta',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Provision Azure AD Users and Groups (SCIM)',
              link: 'https://docs.harness.io/article/aios86yiyk-provision-azure-ad-users-and-groups-scim',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Provision Users and Groups with OneLogin (SCIM)',
              link: 'https://docs.harness.io/article/3hmfr07oz9-provision-users-with-one-login',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Security',
          detailedFeature: [
            {
              title: 'Two-Factor Authentication',
              link: 'https://docs.harness.io/article/h0ie5q5lkl-login-settings',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'RBAC (Role based Access Control) - Built in Roles',
              link: 'https://docs.harness.io/article/ven0bvulsj-users-and-permissions',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'RBAC (Role based Access Control) - Custom Roles',
              link: 'https://docs.harness.io/article/ven0bvulsj-users-and-permissions',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'IP Address Whitelist Management',
              link: 'https://docs.harness.io/article/j2ww8l3yjw-access-management',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Pipeline Governance',
              link: 'https://docs.harness.io/article/zhqccv0pff-pipeline-governance',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Audit Trail',
              link: 'https://docs.harness.io/article/kihlcbcnll-audit-trail',
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: '  Hosting',
          detailedFeature: [
            {
              title: 'Hosting Options',
              link: null,
              communityValue: null,
              communityText: 'Self-hosted',
              freeValue: null,
              freeText: '',
              teamValue: null,
              teamText: 'Self-hosted',
              enterpriseValue: null,
              enterpriseText: 'Self-hosted',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Zero Touch Maintenance (Nothing to Install/Upgrade)',
              link: null,
              communityValue: null,
              communityText: 'NA',
              freeValue: null,
              freeText: null,
              teamValue: null,
              teamText: 'NA',
              enterpriseValue: null,
              enterpriseText: 'NA',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Automatic Horizontal Scaling & High Availability',
              link: null,
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Automatic Backups & Disaster Recovery',
              link: null,
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'SLA guarantee',
              link: null,
              communityValue: null,
              communityText: 'NA',
              freeValue: null,
              freeText: null,
              teamValue: null,
              teamText: 'NA',
              enterpriseValue: null,
              enterpriseText: 'NA',
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Support',
          detailedFeature: [
            {
              title: 'Community',
              link: null,
              communityValue: 'Yes',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Standard (Coverage - 9x5 PST)',
              link: null,
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Premier (Coverage 24x7)',
              link: null,
              communityValue: 'No',
              communityText: null,
              freeValue: null,
              freeText: null,
              teamValue: null,
              teamText: 'Available as an Add-on',
              enterpriseValue: null,
              enterpriseText: 'Available as an Add-on',
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        }
      ],
      cdFeatureCaption: [
        {
          title: 'Free',
          btnText: 'Coming Soon',
          btnLink: null,
          primaryButton: false,
          __typename: 'ComponentPricingPageFeatureCaption'
        },
        {
          title: 'Team',
          btnText: 'Coming Soon',
          btnLink: '',
          primaryButton: false,
          __typename: 'ComponentPricingPageFeatureCaption'
        },
        {
          title: 'Enterprise',
          btnText: 'Try Now',
          btnLink: 'https://app.harness.io/auth/#/signup/?module=cd',
          primaryButton: false,
          __typename: 'ComponentPricingPageFeatureCaption'
        }
      ],
      cdFeatureGroup: [
        {
          title: 'Pricing',
          detailedFeature: [
            {
              title: 'Annual Subscription',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '$0',
              teamValue: null,
              teamText: '$100 per Service per month',
              enterpriseValue: null,
              enterpriseText: 'Custom Pricing',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Monthly Subscription',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '$0',
              teamValue: null,
              teamText: '$120 per Service per month',
              enterpriseValue: null,
              enterpriseText: 'Custom Pricing',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Users',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: 'Unlimited',
              teamValue: null,
              teamText: 'Unlimited',
              enterpriseValue: null,
              enterpriseText: 'Unlimited',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Services',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '5',
              teamValue: null,
              teamText: 'Buy as many, up to a max of 100',
              enterpriseValue: null,
              enterpriseText: 'Buy as many as needed',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Deployments per Day',
              link: null,
              communityValue: null,
              communityText: '',
              freeValue: null,
              freeText: '10',
              teamValue: null,
              teamText: 'Unlimited',
              enterpriseValue: null,
              enterpriseText: 'Unlimited',
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'CD Pipeline Capabilities',
          detailedFeature: [
            {
              title: 'Pipelines as Code / Git Experience',
              link: 'https://docs.harness.io/article/khbt0yhctx-harness-git-ops',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Visual Pipeline Editor with built-in YAML editor',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Pipeline Parametrization',
              link: 'https://docs.harness.io/article/60j7391eyy-templatize-pipelines',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Smart Pipeline Triggers (with customizable webhook based execution)',
              link: 'https://docs.harness.io/article/xerirloz9a-add-a-trigger-2',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Pipeline Notifications',
              link: 'https://docs.harness.io/article/kf828e347t-notification-groups',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Pipeline Scheduling',
              link: 'https://docs.harness.io/article/tb66fmh4iz-trigger-a-deployment-on-a-time-schedule',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Unified Pipeline with Harness CI',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Continous Verification',
              link: 'https://docs.harness.io/category/gurgsl2gqt-continuous-verification',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Deployment Strategies',
          detailedFeature: [
            {
              title: 'Built-in deployment strategies for Canary, Blue-Green, Rolling Updates',
              link: 'https://docs.harness.io/article/325x7awntc-deployment-concepts-and-strategies',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Automated Rollbacks & Failure Strategies',
              link: 'https://docs.harness.io/article/vfp0ksdzg3-define-workflow-failure-strategy-new-template',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Deployment Freeze',
              link: 'https://docs.harness.io/article/wscbhd20ca-deployment-freeze#:~:text=Deployment%20Freeze%20is%20a%20Harness,trade%20shows%2C%20or%20company%20events.',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Deployment Platforms',
          detailedFeature: [
            {
              title: 'Kubernetes',
              link: 'https://docs.harness.io/category/n03qfofd5w-kubernetes-deployments',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Helm',
              link: 'https://docs.harness.io/article/ii558ppikj-helm-deployments-overview',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Amazon ECS',
              link: 'https://docs.harness.io/article/08whoizbps-ecs-deployments-overview',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Azure Kubernetes Service',
              link: 'https://docs.harness.io/article/kiuft72fr5-azure-deployments-overview',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Azure Web App',
              link: 'https://docs.harness.io/article/lluikqw7q7-azure-web-app-deployments-overview',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Tanzu Application Services (formerly Pivotal)',
              link: 'https://docs.harness.io/article/6m7w43yw4u-pcf-tutorial-overview',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Amazon Lambda',
              link: 'https://docs.harness.io/article/z24n8ut61d-lambda-deployment-overview',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Azure functions',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Amazon AMI',
              link: 'https://docs.harness.io/article/ox5ewy2sf4-ami-deployments-overview',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Azure VMSS',
              link: 'https://docs.harness.io/article/1h0723zsvm-azure-virtual-machine-scale-set-deployments',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'IIS (.NET)',
              link: 'https://docs.harness.io/article/d485c2vy7e-iis-net-deployment',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Traditional SSH',
              link: 'https://docs.harness.io/article/6pwni5f9el-traditional-deployments-overview',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Custom Deployments',
              link: 'https://docs.harness.io/article/g7m5a380kl-create-a-custom-deployment',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Integrations',
          detailedFeature: [
            {
              title: 'Integrated Infrastructure Provisioning with Terraform',
              link: 'https://docs.harness.io/article/9pvvgcdbjh-terrform-provisioner',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Infrastructure Provisioning with Terragrunt',
              link: 'https://docs.harness.io/article/a9e63yqb2j-terragrunt-how-tos',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Infrastructure Provisioning with AWS CloudFormation',
              link: 'https://docs.harness.io/article/78g32khjcu-cloud-formation-provisioner',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Infrastructure Provisioning with ARM (Azure Resource Management)',
              link: 'https://docs.harness.io/article/qhnnq1mks3-azure-arm-and-blueprint-how-tos',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Infrastructure Provisioning with Azure Blueprints',
              link: 'https://docs.harness.io/article/sq1xy00oaa-azure-blueprint-how-tos',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Approvals with (built-in) Harness UI',
              link: 'https://docs.harness.io/article/0ajz35u2hy-approvals',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with (built-in) Harness Secrets Manager',
              link: 'https://docs.harness.io/article/avo98eldl0-add-a-google-cloud-kms-secrets-manager',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Approvals with Jira',
              link: 'https://docs.harness.io/article/qxki6o7y31-jira-based-approvals',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Approvals with ServiceNow',
              link: 'https://docs.harness.io/article/9nkuhm8moo-service-now-ticketing-system',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Approvals with Slack',
              link: 'https://docs.harness.io/article/mtr398a9cl-slack-approvals',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Approvals with Custom Shell Scripts',
              link: 'https://docs.harness.io/article/lf79ixw2ge-shell-script-ticketing-system',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with HashiCorp Vault Secrets Manager',
              link: 'https://docs.harness.io/article/am3dmoxywy-add-a-hashi-corp-vault-secrets-manager',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with CyberArk Secrets Manager',
              link: 'https://docs.harness.io/article/uzsv1l2ivd-add-a-cyber-ark-secrets-manager',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with AWS KMS Secrets Manager',
              link: 'https://docs.harness.io/article/qj4psb5vsf-add-an-aws-kms-secrets-manager',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with AWS Secrets Manager',
              link: 'https://docs.harness.io/article/otkxijqoa6-add-an-aws-secrets-manager',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with Azure Key Vault Secrets Manager',
              link: 'https://docs.harness.io/article/2nv0gy1wnh-azure-key-vault',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with Google Cloud Secrets Manager',
              link: 'https://docs.harness.io/article/t0rj3ze6ui-add-a-google-cloud-secrets-manager',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with Custom Secrets Manager',
              link: 'https://docs.harness.io/article/ejaddm3ddb-add-and-use-a-custom-secrets-manager',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Administration',
          detailedFeature: [
            {
              title: 'REST APIs',
              link: 'https://docs.harness.io/category/l2p3i03l4a-api',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Service & Infrastructure dashboards',
              link: 'https://docs.harness.io/article/c3s245o7z8-main-and-services-dashboards',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Built-in User Management & Authentication',
              link: 'https://docs.harness.io/article/zlymcu6bf1-authentication-settings',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Single Sign-On (SSO) with OAuth 2.0',
              link: 'https://docs.harness.io/article/02ehq56x6d-single-sign-on-sso-with-oauth-2-0',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Single Sign-On (SSO) with SAML',
              link: 'https://docs.harness.io/article/zy8yjcrqzg-single-sign-on-sso-with-saml',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Provisioning Users with Okta (SCIM)',
              link: 'https://docs.harness.io/article/8hwnfif0v1-scim-okta',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Provision Azure AD Users and Groups (SCIM)',
              link: 'https://docs.harness.io/article/aios86yiyk-provision-azure-ad-users-and-groups-scim',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Provision Users and Groups with OneLogin (SCIM)',
              link: 'https://docs.harness.io/article/3hmfr07oz9-provision-users-with-one-login',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Multiple Projects',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Multiple Organizations',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Custom Dashboarding',
              link: 'https://docs.harness.io/article/rxlbhvwe6q-custom-dashboards',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Templates Library',
              link: 'https://docs.harness.io/article/dv7ajeroou-account-and-application-templates#shared_template_library_and_application_template_library',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Single Sign-On (SSO) with LDAP',
              link: 'https://docs.harness.io/article/85rycqfiqg-sso-ldap',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Security',
          detailedFeature: [
            {
              title: 'Two-Factor Authentication',
              link: 'https://docs.harness.io/article/h0ie5q5lkl-login-settings',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'RBAC (Role based Access Control) - Built in Roles',
              link: 'https://docs.harness.io/article/ven0bvulsj-users-and-permissions',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'RBAC (Role based Access Control) - Custom Roles',
              link: 'https://docs.harness.io/article/ven0bvulsj-users-and-permissions',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'IP Address Whitelist Management',
              link: 'https://docs.harness.io/article/j2ww8l3yjw-access-management',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Pipeline Governance',
              link: 'https://docs.harness.io/article/zhqccv0pff-pipeline-governance',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Audit Trail',
              link: 'https://docs.harness.io/article/kihlcbcnll-audit-trail',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Hosting',
          detailedFeature: [
            {
              title: 'Hosting Options',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: 'SaaS',
              teamValue: null,
              teamText: 'SaaS',
              enterpriseValue: null,
              enterpriseText: 'SaaS or Self-hosted',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Zero Touch Maintenance (Nothing to Install/Upgrade)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Automatic Horizontal Scaling & High Availability',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Automatic Backups & Disaster Recovery',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'SLA guarantee',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Support',
          detailedFeature: [
            {
              title: 'Community',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Standard (Coverage - 9x5 PST)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Premier (Coverage 24x7)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: null,
              teamText: 'Available as an Add-on',
              enterpriseValue: null,
              enterpriseText: 'Available as an Add-on',
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        }
      ],
      ccFeatureCaption: [
        {
          title: 'Free',
          btnText: 'Coming Soon',
          btnLink: null,
          primaryButton: false,
          __typename: 'ComponentPricingPageFeatureCaption'
        },
        {
          title: 'Team',
          btnText: 'Coming Soon',
          btnLink: '',
          primaryButton: false,
          __typename: 'ComponentPricingPageFeatureCaption'
        },
        {
          title: 'Enterprise',
          btnText: 'Try Now',
          btnLink: 'https://app.harness.io/auth/#/signup/?module=ce',
          primaryButton: false,
          __typename: 'ComponentPricingPageFeatureCaption'
        }
      ],
      ccFeatureGroup: [
        {
          title: 'Pricing',
          detailedFeature: [
            {
              title: 'Annual Subscription',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '$0',
              teamValue: null,
              teamText: '2.25% of Annual Cloud Spend',
              enterpriseValue: null,
              enterpriseText: '2.50% of Annual Cloud Spend',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Monthly Subscription',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '$0',
              teamValue: null,
              teamText: '2.75% of Monthly Cloud Spend',
              enterpriseValue: null,
              enterpriseText: '3.00% of Monthly Cloud Spend',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: ' Cloud Spend',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: ' $250K',
              teamValue: null,
              teamText: 'Buy as much as needed',
              enterpriseValue: null,
              enterpriseText: 'Buy as much as needed',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Clusters',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '2',
              teamValue: null,
              teamText: 'Unlimited',
              enterpriseValue: null,
              enterpriseText: 'Unlimited',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'AutoStopping Rules',
              link: 'https://docs.harness.io/article/wzr5tz0ero-auto-stopping-rules',
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '10',
              teamValue: null,
              teamText: 'Unlimited',
              enterpriseValue: null,
              enterpriseText: 'Unlimited',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Cost Perspectives',
              link: 'https://docs.harness.io/article/dvspc6ub0v-create-cost-perspectives',
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '20',
              teamValue: null,
              teamText: 'Unlimited',
              enterpriseValue: null,
              enterpriseText: 'Unlimited',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Data Retention',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '1 Month',
              teamValue: null,
              teamText: '5 Years',
              enterpriseValue: null,
              enterpriseText: '5 Years',
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Cost Transparency',
          detailedFeature: [
            {
              title: 'Cloud Cost Business Intelligence - Built in Dashboards',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Resource Inventory Management - Built in Dashboards',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Deep Kubernetes Visibility',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Cost Perspectives',
              link: 'https://docs.harness.io/article/dvspc6ub0v-create-cost-perspectives',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Root Cost Analysis',
              link: 'https://docs.harness.io/article/1nf0qcz4o0-analyze-cost-for-aws',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Hourly Time Granularity',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Cloud Event Correlation',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Business Mapping (Coming Soon)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Cloud Cost Business Intelligence - Custom Dashboards',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Resource Inventory Management - Custom Dashboards',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Cost Optimization',
          detailedFeature: [
            {
              title: 'Intelligent Cloud AutoStopping',
              link: 'https://docs.harness.io/article/wzr5tz0ero-auto-stopping-rules',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Spot Orchestration',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Anomaly Detection',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Workload Optimization Recommendations',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Node Optimization Recommendations',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Cost vs. Performance What-if Analysis',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Cost Governance',
          detailedFeature: [
            {
              title: 'Budgeting',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Forecasting',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Custom Alerting (Budgets, Anomalies, BI Dashboards)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'No tagging Required (Current Harness CD customer)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Cost Management Platforms',
          detailedFeature: [
            {
              title: 'Cloud Cost Management for AWS',
              link: 'https://docs.harness.io/article/80vbt5jv0q-set-up-cost-visibility-for-aws',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Cloud Cost Management for Azure',
              link: 'https://docs.harness.io/article/v682mz6qfd-set-up-cost-visibility-for-azure',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Cloud Cost Management for GCP',
              link: 'https://docs.harness.io/article/kxnsritjls-set-up-cost-visibility-for-gcp',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Cloud Cost Management for Kubernetes',
              link: 'https://docs.harness.io/article/ltt65r6k39-set-up-cost-visibility-for-kubernetes',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Administration',
          detailedFeature: [
            {
              title: 'REST APIs',
              link: 'https://docs.harness.io/category/l2p3i03l4a-api',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: ' Built-in User Management & Authentication',
              link: 'https://docs.harness.io/article/zlymcu6bf1-authentication-settings',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Single Sign-On (SSO) with OAuth 2.0',
              link: 'https://docs.harness.io/article/02ehq56x6d-single-sign-on-sso-with-oauth-2-0',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Single Sign-On (SSO) with SAML',
              link: 'https://docs.harness.io/article/zy8yjcrqzg-single-sign-on-sso-with-saml',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: ' Provisioning Users with Okta (SCIM)',
              link: 'https://docs.harness.io/article/8hwnfif0v1-scim-okta',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: ' Provision Azure AD Users and Groups (SCIM)',
              link: 'https://docs.harness.io/article/aios86yiyk-provision-azure-ad-users-and-groups-scim',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Provision Users and Groups with OneLogin (SCIM)',
              link: 'https://docs.harness.io/article/3hmfr07oz9-provision-users-with-one-login',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Custom Dashboarding ',
              link: 'https://docs.harness.io/article/rxlbhvwe6q-custom-dashboards',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Multiple Organizations',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Single Sign-On (SSO) with LDAP',
              link: 'https://docs.harness.io/article/85rycqfiqg-sso-ldap',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Security',
          detailedFeature: [
            {
              title: ' Two-Factor Authentication',
              link: 'https://docs.harness.io/article/h0ie5q5lkl-login-settings',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: ' RBAC (Role based Access Control) - Built in Roles (Coming Soon)',
              link: 'https://docs.harness.io/article/ven0bvulsj-users-and-permissions',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'IP Address Whitelist Management',
              link: 'https://docs.harness.io/article/j2ww8l3yjw-access-management',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Audit Trail',
              link: 'https://docs.harness.io/article/kihlcbcnll-audit-trail',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'RBAC (Role based Access Control) - Custom Roles (Coming Soon)',
              link: 'https://docs.harness.io/article/ven0bvulsj-users-and-permissions',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Hosting',
          detailedFeature: [
            {
              title: 'Hosting Options',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: 'SaaS',
              teamValue: null,
              teamText: 'SaaS',
              enterpriseValue: null,
              enterpriseText: 'SaaS',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Zero Touch Maintenance (Nothing to Install/Upgrade)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Automatic Horizontal Scaling & High Availability',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Automatic Backups & Disaster Recovery',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'SLA guarantee',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Support',
          detailedFeature: [
            {
              title: 'Community',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Standard (Coverage - 9x5 PST)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Premier (Coverage 24x7)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: null,
              teamText: 'Available as an Add-on',
              enterpriseValue: null,
              enterpriseText: 'Available as an Add-on',
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        }
      ],
      ffFeatureCaption: [
        {
          title: 'Free',
          btnText: 'Coming Soon',
          btnLink: null,
          primaryButton: false,
          __typename: 'ComponentPricingPageFeatureCaption'
        },
        {
          title: 'Team',
          btnText: 'Coming Soon',
          btnLink: '',
          primaryButton: false,
          __typename: 'ComponentPricingPageFeatureCaption'
        },
        {
          title: 'Enterprise',
          btnText: 'Try Now',
          btnLink: 'https://app.harness.io/auth/#/signup/?module=cf',
          primaryButton: false,
          __typename: 'ComponentPricingPageFeatureCaption'
        }
      ],
      ffFeatureGroup: [
        {
          title: 'Pricing',
          detailedFeature: [
            {
              title: 'Annual Subscription',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '$0',
              teamValue: null,
              teamText: '$15 per Developer per Month + $75 per 25K MAUs add-on',
              enterpriseValue: null,
              enterpriseText: '$25 per Developer per Month + $100 per 25K MAUs add-on',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Monthly Subscription',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '$0',
              teamValue: null,
              teamText: '$18 per Developer per Month + $90 per 25K MAUs add-on',
              enterpriseValue: null,
              enterpriseText: '$30 per Developer per Month + $120 per 25K MAUs add-on',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Developers',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '2',
              teamValue: null,
              teamText: 'Buy as many, up to a max of 50',
              enterpriseValue: null,
              enterpriseText: 'Buy as many as needed',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'MAUs (Client Monthly Active Users)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '25K',
              teamValue: null,
              teamText: 'Buy as many, up to a max of 1 Million MAUs (25K MAUs included for free)',
              enterpriseValue: null,
              enterpriseText: 'Buy as many as needed (25K MAUs included for free)',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Server Monthly Active Users',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: 'Unlimited',
              teamValue: null,
              teamText: 'Unlimited',
              enterpriseValue: null,
              enterpriseText: 'Unlimited',
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Feature Flag Capabilities',
          detailedFeature: [
            {
              title: 'Boolean flags',
              link: 'https://docs.harness.io/article/1j7pdkqh7j-create-a-feature-flag',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Multivariate flags',
              link: 'https://docs.harness.io/article/1j7pdkqh7j-create-a-feature-flag',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Target individual users, or customizable groups',
              link: 'https://docs.harness.io/article/5qz1qrugyk-add-target-groups',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Progressive delivery (%-based rollouts)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Time-configurable polling mode for flag updates',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Real-time streaming mode for flag updates',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Flags as code / Git Experience',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Pipelines (automations & workflows) (Coming Soon)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Flag Scheduling (Coming Soon)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Require approvals for changes (Coming Soon)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Automated health verifications of changes (Coming Soon)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Experimentation & Monitoring (Coming Soon)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Dashboards and analytics (Coming Soon)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Server SDKs',
          detailedFeature: [
            {
              title: 'Java SDK',
              link: 'https://docs.harness.io/article/i7et9ebkst-integrate-feature-flag-with-java-sdk',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: '.NET SDK',
              link: 'https://docs.harness.io/article/c86rasy39v-net-sdk-reference',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Python SDK',
              link: 'https://docs.harness.io/article/hwoxb6x2oe-python-sdk-reference',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: ' Go SDK',
              link: 'https://docs.harness.io/article/4c8wljx60w-feature-flag-sdks-go-application',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Client SDKs',
          detailedFeature: [
            {
              title: 'JavaScript SDK',
              link: 'https://docs.harness.io/article/bmlvsxhp13-java-script-sdk-references',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Android SDK',
              link: 'https://docs.harness.io/article/74t18egxbi-android-sdk-reference',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'iOS SDK',
              link: 'https://docs.harness.io/article/6qt2v8g92m-ios-sdk-reference',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Flutter SDK',
              link: 'https://docs.harness.io/article/mmf7cu2owg-flutter-sdk-reference',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'C++ SDK',
              link: 'https://docs.harness.io/article/z2w6uj9mzb-react-native-sdk-reference',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Administration',
          detailedFeature: [
            {
              title: 'REST APIs',
              link: 'https://docs.harness.io/category/l2p3i03l4a-api',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Built-in User Management & Authentication',
              link: 'https://docs.harness.io/article/zlymcu6bf1-authentication-settings',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Single Sign-On (SSO) with OAuth 2.0',
              link: 'https://docs.harness.io/article/02ehq56x6d-single-sign-on-sso-with-oauth-2-0',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Single Sign-On (SSO) with SAML',
              link: 'https://docs.harness.io/article/zy8yjcrqzg-single-sign-on-sso-with-saml',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Provisioning Users with Okta (SCIM)',
              link: 'https://docs.harness.io/article/8hwnfif0v1-scim-okta',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Provision Azure AD Users and Groups (SCIM)',
              link: 'https://docs.harness.io/article/aios86yiyk-provision-azure-ad-users-and-groups-scim',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Provision Users and Groups with OneLogin (SCIM)',
              link: 'https://docs.harness.io/article/3hmfr07oz9-provision-users-with-one-login',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Multiple Projects',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Multiple Organizations',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Single Sign-On (SSO) with LDAP',
              link: 'https://docs.harness.io/article/85rycqfiqg-sso-ldap',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Templates Library (coming soon)',
              link: 'https://docs.harness.io/article/dv7ajeroou-account-and-application-templates#shared_template_library_and_application_template_library',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Security',
          detailedFeature: [
            {
              title: 'Two-Factor Authentication',
              link: 'https://docs.harness.io/article/h0ie5q5lkl-login-settings',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'RBAC (Role based Access Control) - Built in Roles',
              link: 'https://docs.harness.io/article/ven0bvulsj-users-and-permissions',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'RBAC (Role based Access Control) - Custom Roles',
              link: 'https://docs.harness.io/article/ven0bvulsj-users-and-permissions',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Pipeline Governance',
              link: 'https://docs.harness.io/article/zhqccv0pff-pipeline-governance',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Audit Trail',
              link: 'https://docs.harness.io/article/kihlcbcnll-audit-trail',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Hosting',
          detailedFeature: [
            {
              title: 'Hosting Options',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: 'SaaS',
              teamValue: null,
              teamText: 'SaaS',
              enterpriseValue: null,
              enterpriseText: 'SaaS',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Zero Touch Maintenance (Nothing to Install/Upgrade)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Automatic Horizontal Scaling & High Availability',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Automatic Backups & Disaster Recovery',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'SLA guarantee',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Support',
          detailedFeature: [
            {
              title: 'Community',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Standard (Coverage - 9x5 PST)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Premier (Coverage 24x7)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: null,
              teamText: 'Available as an Add-on',
              enterpriseValue: null,
              enterpriseText: 'Available as an Add-on',
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        }
      ],
      ciSaasFeatureCaption: [
        {
          title: 'Free',
          btnText: 'Coming Soon',
          btnLink: null,
          primaryButton: false,
          __typename: 'ComponentPricingPageFeatureCaption'
        },
        {
          title: 'Team',
          btnText: 'Coming Soon',
          btnLink: '',
          primaryButton: false,
          __typename: 'ComponentPricingPageFeatureCaption'
        },
        {
          title: 'Enterprise',
          btnText: 'Try Now',
          btnLink: 'https://app.harness.io/auth/#/signup/?module=ci',
          primaryButton: false,
          __typename: 'ComponentPricingPageFeatureCaption'
        }
      ],
      ciSaasFeatureGroup: [
        {
          title: 'Pricing',
          detailedFeature: [
            {
              title: 'Annual Subscription',
              link: '',
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '$0',
              teamValue: null,
              teamText: '$25 per Developer per month',
              enterpriseValue: null,
              enterpriseText: '$50 per Developer per month',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Monthly Subscription',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '$0',
              teamValue: null,
              teamText: '$30 per Developer per month',
              enterpriseValue: null,
              enterpriseText: '$60 per Developer per month',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: ' Developers',
              link: '',
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: ' Unlimited',
              teamValue: null,
              teamText: ' Buy as many, upto a max of 300',
              enterpriseValue: null,
              enterpriseText: ' Buy as many as needed',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: '  Builds per Month',
              link: '',
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: '100 builds per month (after 1st 2500 builds)',
              teamValue: null,
              teamText: ' Unlimited',
              enterpriseValue: null,
              enterpriseText: ' Unlimited',
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'CI Pipeline Capabilities',
          detailedFeature: [
            {
              title: 'Unified Pipeline with Harness CD',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Pipelines as Code / Git Experience',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Visual Pipeline Editor with built -in YAML editor',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Pipeline Parametrization',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Smart Pipeline Triggers (with customizable webhook based execution)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Advanced Conditional Execution (built for debuggability)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Pipeline Notifications',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Pipeline Scheduling',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Test Results Visualization & Analytics',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Build Artifact Summaries',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Monorepo support',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Service Dependencies',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Failure Strategies',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Matrix build stages (Coming Soon)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Tests Intelligence (ML based test cycle optimization - for speed & accuracy)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Integrations',
          detailedFeature: [
            {
              title: 'SCM support (GitHub, BitBucket, GitLab, CodeCommit, generic)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Plugins Support',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'GitHub App support',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Approvals with (built-in) Harness UI',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with (built-in) Harness Secrets Manager',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Approvals with Jira',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Approvals with ServiceNow',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Approvals with Slack',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Approvals with Custom Shell Scripts',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with HashiCorp Vault Secrets Manager',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with CyberArk Secrets Manager',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with AWS KMS Secrets Manager',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with AWS Secrets Manager',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with Azure Key Vault Secrets Manager',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with Google Cloud Secrets Manager',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Integrated Secrets Management with Custom Secrets Manager',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Administration',
          detailedFeature: [
            {
              title: 'REST APIs',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Auto Scaling',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Build Health & Execution Dashboard (Project Overview)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Built-in User Management & Authentication',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Single Sign-On (SSO) with OAuth 2.0',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Single Sign-On (SSO) with SAML',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Provisioning Users with Okta (SCIM)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Provision Azure AD Users and Groups (SCIM)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Provision Users and Groups with OneLogin (SCIM)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Multiple Projects',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Multiple Organizations',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Custom Dashboarding',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Single Sign-On (SSO) with LDAP',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Templates Library (coming soon)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Security',
          detailedFeature: [
            {
              title: 'Two-Factor Authentication',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'RBAC (Role based Access Control) - Built in Roles',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'RBAC (Role based Access Control) - Custom Roles',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'IP Address Whitelist Management',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Pipeline Governance',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Audit Trail',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'No',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: ' Hosting',
          detailedFeature: [
            {
              title: ' Hosting Options',
              link: '',
              communityValue: null,
              communityText: null,
              freeValue: null,
              freeText: 'SaaS',
              teamValue: null,
              teamText: 'SaaS',
              enterpriseValue: null,
              enterpriseText: 'SaaS',
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Zero Touch Maintenance (Nothing to Install/Upgrade)',
              link: '#some-anchor-link',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: ' Automatic Horizontal Scaling & High Availability',
              link: '#some-anchor-link',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: ' Automatic Backups & Disaster Recovery',
              link: '#some-anchor-link',
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: '  SLA guarantee',
              link: '#some-anchor-link',
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        },
        {
          title: 'Support',
          detailedFeature: [
            {
              title: 'Community',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'Yes',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Standard (Coverage - 9x5 PST)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: 'Yes',
              teamText: null,
              enterpriseValue: 'Yes',
              enterpriseText: null,
              __typename: 'ComponentPricingPageDetailedFeature'
            },
            {
              title: 'Premier (Coverage 24x7)',
              link: null,
              communityValue: null,
              communityText: null,
              freeValue: 'No',
              freeText: null,
              teamValue: null,
              teamText: 'Available as an Add-on',
              enterpriseValue: null,
              enterpriseText: 'Available as an Add-on',
              __typename: 'ComponentPricingPageDetailedFeature'
            }
          ],
          __typename: 'ComponentPricingPageFeatureGroup'
        }
      ],
      chIntelFeatureCaption: [],
      chIntelFeatureGroup: [],
      caseStudies: [
        {
          id: '36',
          quote:
            'With Harness, I’m able to give engineers the same deployment experience as a huge tech company with a giant DevOps team.',
          client: 'Evan Thomas | Lead Software Engineer | Tilting Point',
          link: null,
          clientPic: {
            width: 113,
            height: 98,
            url: '/uploads/customers_profile_pic_31a633b56d.svg',
            __typename: 'UploadFile'
          },
          __typename: 'ComponentPageCaseStudyZone'
        },
        {
          id: '37',
          quote: 'We went from 2-3 services to 40 in just a few weeks. I was expecting it to take months.',
          client: 'Marc Pearce | Cloud Operations Manager',
          link: null,
          clientPic: {
            width: 113,
            height: 98,
            url: '/uploads/developer_devops_tools_pic_2_01104821fd.svg',
            __typename: 'UploadFile'
          },
          __typename: 'ComponentPageCaseStudyZone'
        },
        {
          id: '38',
          quote: 'Once teams are using a Harness pipeline, it’s easy for us to add additional mandatory steps..',
          client: 'Russ Barnett | Chief Architect | Ancestry',
          link: null,
          clientPic: {
            width: 113,
            height: 98,
            url: '/uploads/developer_devops_tools_pic_3_ad8ecf0355.svg',
            __typename: 'UploadFile'
          },
          __typename: 'ComponentPageCaseStudyZone'
        }
      ],
      __typename: 'Pricing'
    }
  }
}
