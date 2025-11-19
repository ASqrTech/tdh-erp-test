{ pkgs, ... }: {

  channel = "stable-23.11"; # or "unstable"

  packages = [
    pkgs.nodejs_20
  ];

  env = {
  };

  idx = {
    extensions = [
    ];

    previews = [
      {
        command = "npm run preview";
        port = 3000;
        id = "web";
        label = "Web";
      }
    ];
  };
}
