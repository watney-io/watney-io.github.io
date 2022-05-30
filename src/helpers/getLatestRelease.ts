import { graphql } from "@octokit/graphql";

const githubToken = process.env.GITHUB_TOKEN;
if (!githubToken) {
	throw new ReferenceError("Missing GITHUB_TOKEN environment variable");
}

const releasesQuery = `{
	repository(owner: "traefik", name: "traefik") {
		releases(last: 1, orderBy: {field: CREATED_AT, direction: ASC}) {
			nodes {
				name
				createdAt
				releaseAssets(last: 10) {
					nodes {
						downloadUrl
						name
						size
					}
				}
			}
		}
	}
}`;

interface releaseQueryResult {
	repository: {
		releases: {
			nodes: {
				name: string;
				createdAt: string;
				releaseAssets: {
					nodes: {
						downloadUrl: string;
						name: string;
						size: number;
					}[]
				}
			}[]
		}
	}
}

interface Asset {
	url: string;
	size: string;
}

type Assets = Record<"darwin"|"linux"|"windows", Record<"amd64"|"arm"|"arm64", Asset>>;

interface LatestRelease {
	name: string;
	createdAt: Date;
	assets?: Assets;
}

let latest: LatestRelease;

async function fetchLatest(): Promise<LatestRelease> {
	try {
		const { repository: { releases: { nodes }} }: releaseQueryResult = await graphql(
			releasesQuery,
			{
				headers: {
					authorization: `token ${githubToken}`,
				},
			},
		);

		latest = {
			name: nodes[0].name,
			createdAt: new Date(nodes[0].createdAt),
			assets: nodes[0].releaseAssets.nodes.reduce((acc, cur) => {
				// filename is in format `product_version_os_arch.ext`
				const names = cur.name.split('_');
				if (names.length !== 4) {
					return null;
				}
	
				let os = names[2];
				let arch = names[3].split('.')[0];
				let size = formatBytes(cur.size);

				console.log(Object.keys(acc), os, arch);

				if (!acc[os]) {
					console.log('new key', os, typeof acc)
					acc[os] = {};
				} else {
					console.log('known key', os, typeof acc)
				}

				acc[os][arch] = {
					url: cur.downloadUrl,
					size,
				}
	
				return acc;
			}, {} as Assets),
		};
	} catch (err) {
		console.error(err);
		latest = {
			name: "unknown",
			createdAt: new Date(),
		};
	}

	console.info('Fetched latest release', latest.name);

	return latest;
}

async function getLatestRelease(): Promise<LatestRelease> {
	if (latest) return latest;
	return fetchLatest();
}

function formatBytes(bytes) {
	if (bytes === 0) return "0B";
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))}${['B', 'K', 'M', 'G'][i]}`;
}

export default getLatestRelease;
